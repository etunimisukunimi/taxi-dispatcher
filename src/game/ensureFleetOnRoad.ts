import type { CityBounds, CityId } from '../config/cities';
import { randomRoadPoint } from './randomRoadPoint';
import { snapToDrivingRoad } from '../services/routing';
import type { LatLng, TaxiUnit } from '../types/game';

export async function snapTaxiToRoad(
  position: LatLng,
  _cityId: CityId,
  bounds: CityBounds,
): Promise<LatLng | null> {
  const snapped = await snapToDrivingRoad(position);
  if (snapped) return snapped;
  return randomRoadPoint(bounds);
}

export async function snapTaxiOntoRoad(
  taxi: TaxiUnit,
  cityId: CityId,
  bounds: CityBounds,
): Promise<LatLng | null> {
  const snapped = await snapTaxiToRoad(taxi.position, cityId, bounds);
  if (snapped) return snapped;

  for (let i = 0; i < 12; i++) {
    const point = await randomRoadPoint(bounds);
    if (point) return point;
  }
  return null;
}

export async function ensureFleetOnRoad(
  fleet: TaxiUnit[],
  cityId: CityId,
  bounds: CityBounds,
): Promise<TaxiUnit[]> {
  const updated: TaxiUnit[] = [];
  for (const taxi of fleet) {
    const pos = await snapTaxiOntoRoad(taxi, cityId, bounds);
    if (!pos) {
      updated.push({ ...taxi, positionReady: false });
      continue;
    }
    updated.push({
      ...taxi,
      position: pos,
      routeFrom: pos,
      routeTo: pos,
      routePoints: [pos],
      progressM: 0,
      distanceM: 1,
      idleLeg: taxi.status === 'free' ? null : taxi.idleLeg,
      positionReady: true,
    });
  }
  return updated;
}
