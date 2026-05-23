import { buildRouteGeometry, type RouteGeometry } from './carSimulation';
import type { LatLng } from '../types/game';

const geometryCache = new Map<string, RouteGeometry>();

export function getSimulationGeometry(taxiId: string): RouteGeometry | undefined {
  return geometryCache.get(taxiId);
}

export function setSimulationGeometry(
  taxiId: string,
  geometry: RouteGeometry,
): void {
  geometryCache.set(taxiId, geometry);
}

export function deleteSimulationGeometry(taxiId: string): void {
  geometryCache.delete(taxiId);
}

export function clearSimulationGeometryCache(): void {
  geometryCache.clear();
}

export function resolveRouteGeometry(
  taxiId: string,
  routePoints: LatLng[],
  distanceM: number,
): RouteGeometry {
  const cached = getSimulationGeometry(taxiId);
  const stale =
    !cached ||
    cached.cumulativeM.length !== routePoints.length ||
    Math.abs(cached.totalM - distanceM) > 1;
  const geometry = stale ? buildRouteGeometry(routePoints) : cached;
  setSimulationGeometry(taxiId, geometry);
  return geometry;
}
