import { buildRouteGeometry } from '../game/carSimulation';
import type { LatLng, RouteResult } from '../types/game';
import { haversineMeters } from '../utils/geo';

const OSRM_BASE = import.meta.env.DEV
  ? '/osrm'
  : 'https://router.project-osrm.org';

/** Макс. расстояние «прилипания» к дороге при спавне и построении маршрута */
export const MAX_ROAD_SNAP_M = 45;

type OsrmWaypoint = {
  location: [number, number];
  distance: number;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
  }>;
  waypoints?: OsrmWaypoint[];
};

type OsrmNearestResponse = {
  code: string;
  waypoints?: OsrmWaypoint[];
};

function waypointToLatLng(waypoint: OsrmWaypoint): LatLng {
  const [lng, lat] = waypoint.location;
  return { lat, lng };
}

/** Привязка точки к ближайшей проезжей части (профиль driving) */
export async function snapToDrivingRoad(
  point: LatLng,
  maxSnapM = MAX_ROAD_SNAP_M,
): Promise<LatLng | null> {
  const url =
    `${OSRM_BASE}/nearest/v1/driving/${point.lng},${point.lat}?number=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as OsrmNearestResponse;
    const waypoint = data.waypoints?.[0];
    if (data.code !== 'Ok' || !waypoint || waypoint.distance > maxSnapM) {
      return null;
    }

    return waypointToLatLng(waypoint);
  } catch {
    return null;
  }
}

/** Уплотняет polyline, чтобы машина не «резала» углы и дворы по прямой */
export function densifyRoute(points: LatLng[], stepM = 12): LatLng[] {
  if (points.length < 2) return points;

  const dense: LatLng[] = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = haversineMeters(a, b);
    if (segLen <= stepM) {
      dense.push(b);
      continue;
    }

    const steps = Math.ceil(segLen / stepM);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      dense.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }

  return dense;
}

export async function fetchOsrmRoute(
  from: LatLng,
  to: LatLng,
): Promise<RouteResult | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const radiuses = `${MAX_ROAD_SNAP_M};${MAX_ROAD_SNAP_M}`;
  const url =
    `${OSRM_BASE}/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&radiuses=${radiuses}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OsrmRouteResponse;
    if (data.code !== 'Ok' || !data.routes?.length) {
      return null;
    }

    const route = data.routes[0];
    const snappedFrom = data.waypoints?.[0];
    const snappedTo = data.waypoints?.[1];

    if (
      (snappedFrom && snappedFrom.distance > MAX_ROAD_SNAP_M) ||
      (snappedTo && snappedTo.distance > MAX_ROAD_SNAP_M)
    ) {
      return null;
    }

    const rawPoints: LatLng[] = route.geometry.coordinates.map(([lng, lat]) => ({
      lat,
      lng,
    }));

    if (rawPoints.length < 2) {
      return null;
    }

    const points = densifyRoute(rawPoints);
    const { totalM } = buildRouteGeometry(points);

    return {
      points,
      distanceM: totalM,
      from: snappedFrom ? waypointToLatLng(snappedFrom) : from,
      to: snappedTo ? waypointToLatLng(snappedTo) : to,
    };
  } catch {
    return null;
  }
}
