import type { CityBounds } from '../config/cities';
import { buildRouteGeometry } from './carSimulation';
import type { RouteResult } from '../types/game';
import {
  clampToBounds,
  clipPolylineToBounds,
  isInBounds,
} from '../utils/zoneClip';

export function applyZoneToTrip(
  trip: RouteResult,
  bounds: CityBounds,
): RouteResult | null {
  if (!isInBounds(trip.from, bounds) || !isInBounds(trip.to, bounds)) {
    return null;
  }

  const clipped = clipPolylineToBounds(trip.points, bounds);
  if (clipped.length < 2) {
    return null;
  }

  const geometry = buildRouteGeometry(clipped);

  return {
    from: clampToBounds(trip.from, bounds),
    to: clampToBounds(trip.to, bounds),
    points: clipped,
    distanceM: geometry.totalM,
  };
}
