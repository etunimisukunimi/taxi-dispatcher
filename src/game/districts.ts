import type { CityBounds, CityId } from '../config/cities';
import type { LatLng } from '../types/game';

export type DistrictId = 'center' | 'residential' | 'industrial';

export type DistrictConfig = {
  id: DistrictId;
  label: string;
  bounds: CityBounds;
  fareMultiplier: number;
  spawnWeight: number;
};

export const KAZAN_DISTRICTS: DistrictConfig[] = [
  {
    id: 'center',
    label: 'Центр',
    bounds: [
      [55.76, 49.05],
      [55.82, 49.16],
    ],
    fareMultiplier: 1.1,
    spawnWeight: 1.2,
  },
  {
    id: 'residential',
    label: 'Спальные районы',
    bounds: [
      [55.7, 48.9],
      [55.76, 49.35],
    ],
    fareMultiplier: 0.95,
    spawnWeight: 1,
  },
  {
    id: 'industrial',
    label: 'Окраины',
    bounds: [
      [55.82, 48.9],
      [55.92, 49.35],
    ],
    fareMultiplier: 0.95,
    spawnWeight: 0.85,
  },
];

const DISTRICTS_BY_CITY: Partial<Record<CityId, DistrictConfig[]>> = {
  kazan: KAZAN_DISTRICTS,
};

export function getDistricts(cityId: CityId): DistrictConfig[] {
  return DISTRICTS_BY_CITY[cityId] ?? KAZAN_DISTRICTS;
}

export function getDistrictLabel(
  districtId: DistrictId | string,
  cityId: CityId = 'kazan',
): string {
  return (
    getDistricts(cityId).find((d) => d.id === districtId)?.label ?? districtId
  );
}

function pointInBounds(point: LatLng, bounds: CityBounds): boolean {
  const [[south, west], [north, east]] = bounds;
  return (
    point.lat >= south &&
    point.lat <= north &&
    point.lng >= west &&
    point.lng <= east
  );
}

export function getDistrictForPoint(
  point: LatLng,
  cityId: CityId = 'kazan',
): DistrictConfig {
  const districts = getDistricts(cityId);
  for (const d of districts) {
    if (pointInBounds(point, d.bounds)) return d;
  }
  return districts[0]!;
}

export function getDistrictCenter(district: DistrictConfig): LatLng {
  const [[south, west], [north, east]] = district.bounds;
  return { lat: (south + north) / 2, lng: (west + east) / 2 };
}

export function countFreeTaxisNearDistrict(
  fleet: { status: string; position: LatLng; isBroken?: boolean; needsService?: boolean }[],
  district: DistrictConfig,
  radiusM = 2500,
): number {
  const center = getDistrictCenter(district);
  let count = 0;
  for (const t of fleet) {
    if (t.status !== 'free' || t.isBroken || t.needsService) continue;
    const d =
      Math.hypot(
        (t.position.lat - center.lat) * 111_000,
        (t.position.lng - center.lng) * 65_000,
      );
    if (d <= radiusM) count += 1;
  }
  return count;
}

export function pickDistrictForSpawn(
  cityId: CityId,
  fleet: { status: string; position: LatLng; isBroken?: boolean; needsService?: boolean }[],
): DistrictConfig {
  const districts = getDistricts(cityId);
  const weights = districts.map((d) => {
    const fleetBonus = countFreeTaxisNearDistrict(fleet, d);
    return d.spawnWeight * (1 + fleetBonus * 0.35);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < districts.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return districts[i]!;
  }
  return districts[0]!;
}

export function getDistrictFareMultiplier(districtId: DistrictId | string, cityId: CityId): number {
  return getDistricts(cityId).find((d) => d.id === districtId)?.fareMultiplier ?? 1;
}
