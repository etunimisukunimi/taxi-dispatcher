import { haversineMeters } from '../utils/geo';
import type { LatLng } from '../types/game';

export type RouteGeometry = {
  cumulativeM: number[];
  totalM: number;
};

export function buildRouteGeometry(routePoints: LatLng[]): RouteGeometry {
  const cumulativeM = [0];
  for (let i = 1; i < routePoints.length; i++) {
    cumulativeM.push(
      cumulativeM[i - 1] + haversineMeters(routePoints[i - 1], routePoints[i]),
    );
  }
  return {
    cumulativeM,
    totalM: cumulativeM[cumulativeM.length - 1] ?? 0,
  };
}

function bearingDegrees(from: LatLng, to: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function sampleRoute(
  routePoints: LatLng[],
  geometry: RouteGeometry,
  distanceM: number,
): { position: LatLng; bearingDeg: number } {
  const clamped = Math.max(0, Math.min(distanceM, geometry.totalM));
  const { cumulativeM } = geometry;

  if (routePoints.length === 0) {
    return { position: { lat: 0, lng: 0 }, bearingDeg: 0 };
  }

  if (routePoints.length === 1 || clamped <= 0) {
    const next = routePoints[1] ?? routePoints[0];
    return {
      position: routePoints[0],
      bearingDeg: bearingDegrees(routePoints[0], next),
    };
  }

  let segmentIndex = cumulativeM.findIndex((m) => m >= clamped) - 1;
  if (segmentIndex < 0) {
    segmentIndex = cumulativeM.length - 2;
  }

  const startM = cumulativeM[segmentIndex] ?? 0;
  const endM = cumulativeM[segmentIndex + 1] ?? startM;
  const segmentLen = Math.max(endM - startM, 0.001);
  const t = (clamped - startM) / segmentLen;

  const a = routePoints[segmentIndex];
  const b = routePoints[segmentIndex + 1] ?? a;
  const position: LatLng = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };

  const lookAheadM = Math.min(geometry.totalM, clamped + 40);
  let aheadIndex = cumulativeM.findIndex((m) => m >= lookAheadM) - 1;
  if (aheadIndex < segmentIndex) aheadIndex = segmentIndex;
  const aheadPoint = routePoints[Math.min(aheadIndex + 1, routePoints.length - 1)] ?? b;

  return {
    position,
    bearingDeg: bearingDegrees(position, aheadPoint),
  };
}
