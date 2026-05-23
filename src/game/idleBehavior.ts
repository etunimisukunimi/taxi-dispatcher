import { GAME_BALANCE } from '../config/gameBalance';
import type { CityBounds, CityId } from '../config/cities';
import { snapTaxiOntoRoad } from './ensureFleetOnRoad';
import { buildTaxiRoute } from './dispatch';
import { randomRoadPoint } from './randomRoadPoint';
import type { LatLng, TaxiUnit } from '../types/game';
import { haversineMeters } from '../utils/geo';

const IDLE_PROCESSING = new Set<string>();

export function getIdleSpeedMps(pace: number): number {
  return GAME_BALANCE.baseSpeedMps * 0.35 * pace;
}

export function shouldStartIdleLeg(
  taxi: TaxiUnit,
  gameTimeMs: number,
): boolean {
  if (taxi.status === 'in_garage') return false;
  if (taxi.status !== 'free' && taxi.status !== 'on_break') return false;
  if (taxi.assignedOrderId) return false;
  if (gameTimeMs < taxi.idleUntilGameMs) return false;
  if (taxi.status === 'on_break' && taxi.idleLeg === 'stand') return false;
  const onRoute =
    taxi.routePoints.length >= 2 && taxi.progressM < taxi.distanceM - 1;
  return !onRoute;
}

function randomStandDurationGameMs(): number {
  const minSec = 8;
  const maxSec = 22;
  const sec = minSec + Math.random() * (maxSec - minSec);
  return sec * 1000;
}

async function pickIdleDestination(
  playBounds: CityBounds,
  from: LatLng,
): Promise<LatLng | null> {
  for (let i = 0; i < 10; i++) {
    const candidate = await randomRoadPoint(playBounds);
    if (!candidate) continue;
    const d = haversineMeters(from, candidate);
    if (d >= 300 && d <= 1200) return candidate;
  }
  for (let i = 0; i < 10; i++) {
    const candidate = await randomRoadPoint(playBounds);
    if (!candidate) continue;
    const d = haversineMeters(from, candidate);
    if (d >= 200 && d <= 4000) return candidate;
  }
  return randomRoadPoint(playBounds);
}

export type IdleLegPatch = Partial<TaxiUnit>;

export async function startIdleLeg(
  taxi: TaxiUnit,
  cityId: CityId,
  gameTimeMs: number,
  playBounds: CityBounds,
): Promise<IdleLegPatch | null> {
  if (IDLE_PROCESSING.has(taxi.id)) return null;
  IDLE_PROCESSING.add(taxi.id);

  try {
    const onRoad = await snapTaxiOntoRoad(taxi, cityId, playBounds);
    const taxiOnRoad = onRoad
      ? { ...taxi, position: onRoad, routePoints: [onRoad], routeFrom: onRoad, routeTo: onRoad }
      : taxi;

    if (taxi.status === 'on_break') {
      return {
        position: taxiOnRoad.position,
        routeFrom: taxiOnRoad.position,
        routeTo: taxiOnRoad.position,
        routePoints: [taxiOnRoad.position],
        idleLeg: 'stand',
        idleUntilGameMs: gameTimeMs + randomStandDurationGameMs(),
        progressM: 0,
        distanceM: 1,
      };
    }

    const drive = Math.random() < 0.88;
    if (!drive) {
      return {
        position: taxiOnRoad.position,
        routeFrom: taxiOnRoad.position,
        routeTo: taxiOnRoad.position,
        routePoints: [taxiOnRoad.position],
        idleLeg: 'stand',
        idleUntilGameMs: gameTimeMs + randomStandDurationGameMs(),
        progressM: 0,
        distanceM: 1,
      };
    }

    let to: LatLng | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      to = await pickIdleDestination(playBounds, taxiOnRoad.position);
      if (to) break;
    }
    if (!to) {
      return {
        position: taxiOnRoad.position,
        routeFrom: taxiOnRoad.position,
        routeTo: taxiOnRoad.position,
        routePoints: [taxiOnRoad.position],
        idleLeg: 'stand',
        idleUntilGameMs: gameTimeMs + randomStandDurationGameMs(),
        progressM: 0,
        distanceM: 1,
      };
    }

    const patch = await buildTaxiRoute(
      taxiOnRoad,
      taxiOnRoad.position,
      to,
      playBounds,
    );
    if (!patch) {
      const fallback = await randomRoadPoint(playBounds);
      if (fallback) {
        return {
          position: fallback,
          routeFrom: fallback,
          routeTo: fallback,
          routePoints: [fallback],
          progressM: 0,
          distanceM: 1,
          idleLeg: null,
          idleUntilGameMs: gameTimeMs,
        };
      }
      return {
        position: taxiOnRoad.position,
        routeFrom: taxiOnRoad.position,
        routeTo: taxiOnRoad.position,
        routePoints: [taxiOnRoad.position],
        idleLeg: 'stand',
        idleUntilGameMs: gameTimeMs + randomStandDurationGameMs(),
        progressM: 0,
        distanceM: 1,
      };
    }

    return {
      ...patch,
      idleLeg: 'drive',
      idleUntilGameMs: 0,
    };
  } finally {
    IDLE_PROCESSING.delete(taxi.id);
  }
}

export function finishIdleRoute(
  taxi: TaxiUnit,
  gameTimeMs: number,
): IdleLegPatch {
  return {
    idleLeg: null,
    idleUntilGameMs: gameTimeMs,
    routePoints: [taxi.position],
    progressM: 0,
    distanceM: 1,
    position: taxi.dropoffPoint ?? taxi.position,
  };
}

export function randomFallbackPosition(bounds: CityBounds): LatLng {
  const [[south, west], [north, east]] = bounds;
  return {
    lat: south + Math.random() * (north - south),
    lng: west + Math.random() * (east - west),
  };
}
