import { getCity, type CityBounds, type CityId } from './cities';

/** Половина размера игровой зоны (как у Казани по умолчанию) */
export const DEFAULT_ZONE_HALF_LAT = 0.11;
export const DEFAULT_ZONE_HALF_LNG = 0.225;

export function getPlayBounds(
  cityId: CityId,
  customZoneBounds: CityBounds | null,
): CityBounds {
  return customZoneBounds ?? getCity(cityId).bounds;
}

const playCenterCache = new Map<string, [number, number]>();

function playCenterCacheKey(
  cityId: CityId,
  customZoneBounds: CityBounds | null,
): string {
  if (!customZoneBounds) return cityId;
  const [[s, w], [n, e]] = customZoneBounds;
  return `${cityId}:${s},${w},${n},${e}`;
}

export function getPlayCenter(
  cityId: CityId,
  customZoneBounds: CityBounds | null,
): [number, number] {
  const key = playCenterCacheKey(cityId, customZoneBounds);
  const cached = playCenterCache.get(key);
  if (cached) return cached;

  let center: [number, number];
  if (customZoneBounds) {
    const [[south, west], [north, east]] = customZoneBounds;
    center = [(south + north) / 2, (west + east) / 2];
  } else {
    center = getCity(cityId).center;
  }
  playCenterCache.set(key, center);
  return center;
}

export function boundsFromCenter(center: [number, number]): CityBounds {
  return [
    [
      center[0] - DEFAULT_ZONE_HALF_LAT,
      center[1] - DEFAULT_ZONE_HALF_LNG,
    ],
    [
      center[0] + DEFAULT_ZONE_HALF_LAT,
      center[1] + DEFAULT_ZONE_HALF_LNG,
    ],
  ];
}

export function selectPlayBounds(state: {
  cityId: CityId;
  customZoneBounds: CityBounds | null;
}): CityBounds {
  return getPlayBounds(state.cityId, state.customZoneBounds);
}

export function selectPlayCenter(state: {
  cityId: CityId;
  customZoneBounds: CityBounds | null;
}): [number, number] {
  return getPlayCenter(state.cityId, state.customZoneBounds);
}
