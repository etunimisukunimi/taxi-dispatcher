import { getCity, type CityBounds, type CityId } from '../config/cities';
import { applyZoneToTrip } from './applyZoneLimits';
import {
  fetchOsrmRoute,
  MAX_ROAD_SNAP_M,
  snapToDrivingRoad,
} from '../services/routing';
import type { LatLng, RouteResult } from '../types/game';
import { haversineMeters } from '../utils/geo';
import { isInBounds } from '../utils/zoneClip';

const MIN_TRIP_DISTANCE_M = 1200;
const MAX_SPAWN_ATTEMPTS = 8;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomPointInBounds(bounds: CityBounds): LatLng {
  const [[south, west], [north, east]] = bounds;
  return {
    lat: randomBetween(south, north),
    lng: randomBetween(west, east),
  };
}

/** Случайная точка только на проезжей части (не в парке/дворе) */
async function randomRoadPoint(cityId: CityId): Promise<LatLng | null> {
  const city = getCity(cityId);

  for (let i = 0; i < 12; i++) {
    const candidate = randomPointInBounds(city.bounds);
    const snapped = await snapToDrivingRoad(candidate, MAX_ROAD_SNAP_M);
    if (snapped && isInBounds(snapped, city.bounds)) {
      return snapped;
    }
  }

  return null;
}

async function randomRoadEndpoints(
  cityId: CityId,
): Promise<{ from: LatLng; to: LatLng } | null> {
  const from = await randomRoadPoint(cityId);
  if (!from) return null;

  for (let i = 0; i < 15; i++) {
    const to = await randomRoadPoint(cityId);
    if (to && haversineMeters(from, to) >= MIN_TRIP_DISTANCE_M) {
      return { from, to };
    }
  }

  return null;
}

export { haversineMeters };

export async function spawnRandomTrip(
  cityId: CityId = 'kazan',
): Promise<(RouteResult & { from: LatLng; to: LatLng }) | null> {
  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    const endpoints = await randomRoadEndpoints(cityId);
    if (!endpoints) continue;

    const route = await fetchOsrmRoute(endpoints.from, endpoints.to);
    if (!route) continue;

    const city = getCity(cityId);
    const zoned = applyZoneToTrip(route, city.bounds);
    if (zoned && zoned.distanceM > MIN_TRIP_DISTANCE_M) {
      return zoned;
    }
  }

  return null;
}
