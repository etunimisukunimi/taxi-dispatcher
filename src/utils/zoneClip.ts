import type { CityBounds } from '../config/cities';
import type { LatLng } from '../types/game';

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;
const EPS = 1e-12;

export function isValidLatLng(point: LatLng): boolean {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

export function isInBounds(point: LatLng, bounds: CityBounds): boolean {
  const [[south, west], [north, east]] = bounds;
  return (
    point.lat >= south &&
    point.lat <= north &&
    point.lng >= west &&
    point.lng <= east
  );
}

export function clampToBounds(point: LatLng, bounds: CityBounds): LatLng {
  const [[south, west], [north, east]] = bounds;
  return {
    lat: Math.min(north, Math.max(south, point.lat)),
    lng: Math.min(east, Math.max(west, point.lng)),
  };
}

function computeCode(lat: number, lng: number, bounds: CityBounds): number {
  const [[south, west], [north, east]] = bounds;
  let code = INSIDE;
  if (lng < west) code |= LEFT;
  else if (lng > east) code |= RIGHT;
  if (lat < south) code |= BOTTOM;
  else if (lat > north) code |= TOP;
  return code;
}

function clipSegment(a: LatLng, b: LatLng, bounds: CityBounds): LatLng[] {
  const [[south, west], [north, east]] = bounds;
  let x0 = a.lng;
  let y0 = a.lat;
  let x1 = b.lng;
  let y1 = b.lat;
  let code0 = computeCode(y0, x0, bounds);
  let code1 = computeCode(y1, x1, bounds);
  let accept = false;

  for (let guard = 0; guard < 20; guard++) {
    if (!(code0 | code1)) {
      accept = true;
      break;
    }
    if (code0 & code1) {
      break;
    }

    const codeOut = code0 || code1;
    let x = 0;
    let y = 0;

    if (codeOut & TOP) {
      y = north;
      x = Math.abs(y1 - y0) < EPS ? x0 : x0 + ((x1 - x0) * (north - y0)) / (y1 - y0);
    } else if (codeOut & BOTTOM) {
      y = south;
      x = Math.abs(y1 - y0) < EPS ? x0 : x0 + ((x1 - x0) * (south - y0)) / (y1 - y0);
    } else if (codeOut & RIGHT) {
      x = east;
      y = Math.abs(x1 - x0) < EPS ? y0 : y0 + ((y1 - y0) * (east - x0)) / (x1 - x0);
    } else if (codeOut & LEFT) {
      x = west;
      y = Math.abs(x1 - x0) < EPS ? y0 : y0 + ((y1 - y0) * (west - x0)) / (x1 - x0);
    }

    if (codeOut === code0) {
      x0 = x;
      y0 = y;
      code0 = computeCode(y0, x0, bounds);
    } else {
      x1 = x;
      y1 = y;
      code1 = computeCode(y1, x1, bounds);
    }
  }

  if (!accept) return [];

  const start = { lat: y0, lng: x0 };
  const end = { lat: y1, lng: x1 };
  if (!isValidLatLng(start) || !isValidLatLng(end)) {
    return [];
  }

  return [start, end];
}

function samePoint(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lng - b.lng) < 1e-9;
}

export function clipPolylineToBounds(
  points: LatLng[],
  bounds: CityBounds,
): LatLng[] {
  if (points.length < 2) {
    return points.filter((p) => isInBounds(p, bounds) && isValidLatLng(p));
  }

  const result: LatLng[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const segment = clipSegment(points[i], points[i + 1], bounds);
    if (segment.length < 2) continue;

    if (result.length === 0) {
      result.push(segment[0]);
    } else if (!samePoint(result[result.length - 1], segment[0])) {
      result.push(segment[0]);
    }
    result.push(segment[1]);
  }

  return result.filter(isValidLatLng);
}

export function isPolylineInBounds(
  points: LatLng[],
  bounds: CityBounds,
): boolean {
  return points.every((p) => isInBounds(p, bounds) && isValidLatLng(p));
}
