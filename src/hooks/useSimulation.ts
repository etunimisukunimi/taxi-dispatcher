import { useEffect, useRef } from 'react';
import { selectPlayBounds } from '../config/gameBounds';
import { getGamePace } from '../config/gameBalance';
import { buildRouteGeometry, sampleRoute } from '../game/carSimulation';
import { buildTaxiRoute } from '../game/dispatch';
import {
  finishIdleRoute,
  getIdleSpeedMps,
  shouldStartIdleLeg,
  startIdleLeg,
} from '../game/idleBehavior';
import { getDriverSpeedMps, recoverFatigue } from '../game/fatigue';
import { getWorldModifiers } from '../game/modifiers';
import {
  deleteSimulationGeometry,
  resolveRouteGeometry,
  setSimulationGeometry,
} from '../game/simulationGeometryCache';
import type { TaxiUnit } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { clampToBounds } from '../utils/zoneClip';

function syncGeometry(taxiId: string, points: { lat: number; lng: number }[]) {
  setSimulationGeometry(taxiId, buildRouteGeometry(points));
}

type RoutePatch = Partial<TaxiUnit>;

function applyPassengerLeg(taxiId: string, patch: RoutePatch) {
  if (!patch) return;
  const taxi = useGameStore.getState().fleet.find((t) => t.id === taxiId);
  syncGeometry(taxiId, patch.routePoints ?? []);
  useGameStore.getState().updateTaxi(taxiId, {
    ...patch,
    status: 'on_trip',
    tripPhase: 'with_passenger',
    position: patch.position,
    idleLeg: null,
    pickupLegDistanceM: taxi?.distanceM ?? 0,
  });
}

export function useSimulation() {
  const cityId = useGameStore((s) => s.cityId);
  const boundsKey = useGameStore((s) => {
    const b = selectPlayBounds(s);
    return `${b[0][0]},${b[0][1]},${b[1][0]},${b[1][1]}`;
  });
  const boundsRef = useRef(selectPlayBounds(useGameStore.getState()));
  const processingRef = useRef(new Set<string>());
  const prefetchingRef = useRef(new Set<string>());
  const prefetchRef = useRef(new Map<string, RoutePatch>());
  const idleStartRef = useRef(new Set<string>());
  const routingSinceRef = useRef(new Map<string, number>());
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    boundsRef.current = selectPlayBounds(useGameStore.getState());

    const tick = (time: number) => {
      const bounds = boundsRef.current;
      const last = lastRef.current || time;
      const dtReal = Math.min((time - last) / 1000, 0.1);
      lastRef.current = time;

      const store = useGameStore.getState();
      const pace = getGamePace(store.timeScaleMode);
      const dtGameSec = dtReal * pace;
      const gameTimeMs = store.gameTimeMs + dtGameSec * 1000;
      store.tickGameTime(dtGameSec * 1000);

      let fleetChanged = false;
      const updates: Array<{ id: string; patch: Parameters<typeof store.updateTaxi>[1] }> = [];
      let idleStartsThisTick = 0;
      const maxIdleStartsPerTick = Math.min(
        5,
        Math.max(1, Math.ceil(store.fleet.length / 2)),
      );

      for (const taxi of store.fleet) {
        if (!taxi.positionReady) {
          continue;
        }

        if (taxi.status === 'routing') {
          if (taxi.routePoints.length >= 2) {
            routingSinceRef.current.delete(taxi.id);
          } else {
            const since = routingSinceRef.current.get(taxi.id) ?? time;
            routingSinceRef.current.set(taxi.id, since);
            if (time - since > 12_000) {
              routingSinceRef.current.delete(taxi.id);
              useGameStore.getState().forceTaxiFree(taxi.id);
            }
          }
          continue;
        }

        if (taxi.isBroken || taxi.needsService) {
          continue;
        }

        if (taxi.status === 'in_garage') {
          continue;
        }

        if (taxi.status === 'on_break') {
          const driver = recoverFatigue(taxi.driver, dtGameSec);
          const patch: Parameters<typeof store.updateTaxi>[1] = {};
          if (driver.fatigue !== taxi.driver.fatigue) {
            patch.driver = driver;
          }

          if (
            shouldStartIdleLeg(taxi, gameTimeMs) &&
            idleStartsThisTick < maxIdleStartsPerTick &&
            !idleStartRef.current.has(taxi.id)
          ) {
            idleStartRef.current.add(taxi.id);
            idleStartsThisTick += 1;
            void startIdleLeg(taxi, cityId, gameTimeMs, bounds).then((idlePatch) => {
              idleStartRef.current.delete(taxi.id);
              if (idlePatch) {
                useGameStore.getState().updateTaxi(taxi.id, idlePatch);
                if (idlePatch.routePoints && idlePatch.routePoints.length >= 2) {
                  syncGeometry(taxi.id, idlePatch.routePoints);
                }
              }
            });
          }

          if (Object.keys(patch).length > 0) {
            updates.push({ id: taxi.id, patch });
            fleetChanged = true;
          }
          continue;
        }

        if (taxi.status === 'free') {
          prefetchRef.current.delete(taxi.id);
          prefetchingRef.current.delete(taxi.id);

          const onIdleRoute =
            taxi.idleLeg === 'drive' &&
            taxi.routePoints.length >= 2 &&
            taxi.progressM < taxi.distanceM - 1;

          if (onIdleRoute) {
            const geometry = resolveRouteGeometry(
              taxi.id,
              taxi.routePoints,
              taxi.distanceM,
            );

            const speed = getIdleSpeedMps(pace);
            const newProgress = taxi.progressM + speed * dtReal;

            if (newProgress >= taxi.distanceM) {
              updates.push({
                id: taxi.id,
                patch: finishIdleRoute(
                  { ...taxi, progressM: newProgress },
                  gameTimeMs,
                ),
              });
              fleetChanged = true;
            } else {
              const { position, bearingDeg } = sampleRoute(
                taxi.routePoints,
                geometry,
                newProgress,
              );
              updates.push({
                id: taxi.id,
                patch: {
                  progressM: newProgress,
                  position: clampToBounds(position, bounds),
                  bearingDeg,
                },
              });
              fleetChanged = true;
            }
          } else if (
            shouldStartIdleLeg(taxi, gameTimeMs) &&
            idleStartsThisTick < maxIdleStartsPerTick &&
            !idleStartRef.current.has(taxi.id)
          ) {
            idleStartRef.current.add(taxi.id);
            idleStartsThisTick += 1;
            void startIdleLeg(taxi, cityId, gameTimeMs, bounds).then((idlePatch) => {
              idleStartRef.current.delete(taxi.id);
              if (idlePatch) {
                useGameStore.getState().updateTaxi(taxi.id, idlePatch);
                if (idlePatch.routePoints && idlePatch.routePoints.length >= 2) {
                  syncGeometry(taxi.id, idlePatch.routePoints);
                }
              }
            });
          }
          continue;
        }

        if (taxi.status !== 'to_pickup' && taxi.status !== 'on_trip') {
          continue;
        }

        const geometry = resolveRouteGeometry(
          taxi.id,
          taxi.routePoints,
          taxi.distanceM,
        );

        if (
          taxi.status === 'to_pickup' &&
          taxi.dropoffPoint &&
          taxi.distanceM > 0
        ) {
          const legProgress = taxi.progressM / taxi.distanceM;
          if (
            legProgress >= 0.85 &&
            !prefetchRef.current.has(taxi.id) &&
            !prefetchingRef.current.has(taxi.id) &&
            !processingRef.current.has(taxi.id)
          ) {
            prefetchingRef.current.add(taxi.id);
            void buildTaxiRoute(
              taxi,
              taxi.pickupPoint ?? taxi.position,
              taxi.dropoffPoint,
              bounds,
            ).then((patch) => {
              prefetchingRef.current.delete(taxi.id);
              if (patch) {
                prefetchRef.current.set(taxi.id, patch);
              }
            });
          }
        }

        const worldMods = getWorldModifiers(
          store.gameTimeMs,
          store.weather,
          store.parkRating,
          store.activeEvent,
        );
        const speed = getDriverSpeedMps(
          taxi.driver,
          pace,
          worldMods.speedMult,
        );
        const newProgress = taxi.progressM + speed * dtReal;

        if (newProgress >= taxi.distanceM) {
          if (taxi.status === 'to_pickup' && taxi.dropoffPoint) {
            const prefetched = prefetchRef.current.get(taxi.id);
            if (prefetched) {
              prefetchRef.current.delete(taxi.id);
              useGameStore.getState().setNetworkError(false);
              applyPassengerLeg(taxi.id, prefetched);
              continue;
            }

            if (!processingRef.current.has(taxi.id)) {
              processingRef.current.add(taxi.id);
              const pickupPos =
                taxi.pickupPoint ??
                sampleRoute(taxi.routePoints, geometry, taxi.distanceM).position;
              updates.push({
                id: taxi.id,
                patch: {
                  progressM: taxi.distanceM,
                  position: clampToBounds(pickupPos, bounds),
                },
              });
              fleetChanged = true;

              void (async () => {
                const patch = await buildTaxiRoute(
                  taxi,
                  taxi.pickupPoint ?? taxi.position,
                  taxi.dropoffPoint!,
                  bounds,
                );
                processingRef.current.delete(taxi.id);
                if (!patch) {
                  useGameStore.getState().setNetworkError(true);
                  useGameStore.getState().forceTaxiFree(taxi.id);
                  return;
                }
                useGameStore.getState().setNetworkError(false);
                applyPassengerLeg(taxi.id, patch);
              })();
            }
            continue;
          }

          if (
            taxi.status === 'on_trip' &&
            taxi.tripPhase === 'with_passenger'
          ) {
            useGameStore.getState().completeTrip(taxi.id);
            deleteSimulationGeometry(taxi.id);
            prefetchRef.current.delete(taxi.id);
            fleetChanged = true;
            continue;
          }
        }

        const { position, bearingDeg } = sampleRoute(
          taxi.routePoints,
          geometry,
          newProgress,
        );

        updates.push({
          id: taxi.id,
          patch: {
            progressM: newProgress,
            position: clampToBounds(position, bounds),
            bearingDeg,
          },
        });
        fleetChanged = true;
      }

      if (fleetChanged && updates.length > 0) {
        store.updateFleet(updates);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cityId, boundsKey]);
}
