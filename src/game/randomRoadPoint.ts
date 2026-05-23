import type { CityBounds } from '../config/cities';
import { snapToDrivingRoad } from '../services/routing';
import type { LatLng } from '../types/game';

function randomInBounds(bounds: CityBounds): LatLng {
  const [[south, west], [north, east]] = bounds;
  return {
    lat: south + Math.random() * (north - south),
    lng: west + Math.random() * (east - west),
  };
}

export async function randomRoadPoint(
  bounds: CityBounds,
): Promise<LatLng | null> {
  for (let i = 0; i < 10; i++) {
    const snapped = await snapToDrivingRoad(randomInBounds(bounds));
    if (snapped) return snapped;
  }
  return null;
}
