import {
  GAME_BALANCE,
  calcOrderFare,
  calcTripDurationGameSec,
} from '../config/gameBalance';
import type { CarClass } from '../config/carAssets';
import { TAXI_UPGRADES_BALANCE } from '../config/taxiUpgradesBalance';
import { TIME_WEATHER_BALANCE } from '../config/timeWeatherBalance';
import { getCity, type CityId } from '../config/cities';
import { fetchRouteQueued } from './routeQueue';
import { applyZoneToTrip } from './applyZoneLimits';
import { randomRoadPoint } from './randomRoadPoint';
import {
  getDistrictForPoint,
  getDistricts,
  pickDistrictForSpawn,
  type DistrictConfig,
} from './districts';
import { pickWeightedCarClass } from './modifiers';
import type { Order, TaxiUnit } from '../types/game';
import { haversineMeters } from '../utils/geo';
import { formatAddress } from '../utils/addressLabels';
import type { LatLng } from '../types/game';

let orderCounter = 0;

export type OrderSpawnOptions = {
  classBias?: number;
  maxRouteM?: number | null;
  eventDistrictId?: string | null;
};

type OrderRequirements = {
  requiredClass: CarClass | null;
  requiresChildSeat: boolean;
  requiresPetCarrier: boolean;
};

function pickSpecialRequirements(): Pick<
  OrderRequirements,
  'requiresChildSeat' | 'requiresPetCarrier'
> {
  if (Math.random() >= TAXI_UPGRADES_BALANCE.specialOrderChance) {
    return { requiresChildSeat: false, requiresPetCarrier: false };
  }

  const roll = Math.random();
  const childShare = TAXI_UPGRADES_BALANCE.childSeatOrderShare;
  if (roll < childShare) {
    return { requiresChildSeat: true, requiresPetCarrier: false };
  }
  if (roll < childShare + TAXI_UPGRADES_BALANCE.petCarrierOrderShare) {
    return { requiresChildSeat: false, requiresPetCarrier: true };
  }
  return { requiresChildSeat: true, requiresPetCarrier: true };
}

function pickOrderRequirements(classBias = 0.5): OrderRequirements {
  const special = pickSpecialRequirements();
  return {
    requiredClass: pickWeightedCarClass(classBias),
    ...special,
  };
}

function pickPreviewClass(required: CarClass | null): CarClass {
  if (required) return required;
  return 'econom';
}

function maxDistanceForAttempt(maxRouteM: number | null | undefined): number {
  const cap = maxRouteM ?? GAME_BALANCE.orderRareMaxDistanceM;
  if (Math.random() < GAME_BALANCE.orderLongRouteChance) {
    return Math.min(cap, GAME_BALANCE.orderRareMaxDistanceM);
  }
  return Math.min(cap, GAME_BALANCE.orderTypicalMaxDistanceM);
}

function fleetAnchors(fleet: TaxiUnit[]): LatLng[] {
  return fleet.map((t) => t.position);
}

async function pickFromNearFleet(
  playBounds: import('../config/cities').CityBounds,
  anchors: LatLng[],
): Promise<LatLng | null> {
  const anchor = anchors[Math.floor(Math.random() * anchors.length)]!;
  const radius = GAME_BALANCE.orderSpawnNearRadiusM;

  for (let i = 0; i < 16; i++) {
    const candidate = await randomRoadPoint(playBounds);
    if (!candidate) continue;
    const d = haversineMeters(anchor, candidate);
    if (d <= radius && d >= 400) return candidate;
  }
  return null;
}

async function pickDestination(
  playBounds: import('../config/cities').CityBounds,
  from: LatLng,
  maxDist: number,
): Promise<LatLng | null> {
  const min = GAME_BALANCE.orderMinDistanceM;

  for (let i = 0; i < 14; i++) {
    const candidate = await randomRoadPoint(playBounds);
    if (!candidate) continue;
    const d = haversineMeters(from, candidate);
    if (d >= min && d <= maxDist * 1.15) {
      return candidate;
    }
  }
  return null;
}

async function pickOrderOriginInDistrict(
  playBounds: import('../config/cities').CityBounds,
  district: DistrictConfig,
): Promise<LatLng | null> {
  const [[south, west], [north, east]] = district.bounds;
  for (let i = 0; i < 20; i++) {
    const candidate = await randomRoadPoint(playBounds);
    if (!candidate) continue;
    if (
      candidate.lat >= south &&
      candidate.lat <= north &&
      candidate.lng >= west &&
      candidate.lng <= east
    ) {
      return candidate;
    }
  }
  return randomRoadPoint(playBounds);
}

async function pickOrderOrigin(
  cityId: CityId,
  fleet: TaxiUnit[],
  preferredDistrict: DistrictConfig | null,
  playBounds: import('../config/cities').CityBounds,
): Promise<LatLng | null> {
  const anchors = fleetAnchors(fleet);
  const nearFleet =
    anchors.length > 0 &&
    Math.random() < GAME_BALANCE.orderSpawnNearFleetChance;

  if (nearFleet) {
    const near = await pickFromNearFleet(playBounds, anchors);
    if (near) return near;
  }

  if (preferredDistrict) {
    const inDistrict = await pickOrderOriginInDistrict(
      playBounds,
      preferredDistrict,
    );
    if (inDistrict) return inDistrict;
  }

  const district = pickDistrictForSpawn(cityId, fleet);
  return pickOrderOriginInDistrict(playBounds, district);
}

export async function generateOrder(
  cityId: CityId,
  gameTimeMs: number,
  fleet: TaxiUnit[] = [],
  options: OrderSpawnOptions = {},
  playBounds?: import('../config/cities').CityBounds,
): Promise<Order | null> {
  const bounds = playBounds ?? getCity(cityId).bounds;
  const classBias = options.classBias ?? 0.5;
  const requirements = pickOrderRequirements(classBias);

  const eventDistrict =
    options.eventDistrictId != null
      ? getDistricts(cityId).find((d) => d.id === options.eventDistrictId)
      : undefined;

  for (let attempt = 0; attempt < 8; attempt++) {
    const spawnDistrict =
      eventDistrict && Math.random() < 0.65
        ? eventDistrict
        : pickDistrictForSpawn(cityId, fleet);

    const from = await pickOrderOrigin(
      cityId,
      fleet,
      spawnDistrict,
      bounds,
    );
    if (!from) continue;

    const maxDist = maxDistanceForAttempt(options.maxRouteM);
    const to = await pickDestination(bounds, from, maxDist);
    if (!to) continue;

    const raw = await fetchRouteQueued(from, to);
    if (!raw) continue;

    const zoned = applyZoneToTrip(raw, bounds);
    if (!zoned) continue;

    const { distanceM } = zoned;
    if (distanceM < GAME_BALANCE.orderMinDistanceM) continue;
    if (distanceM > GAME_BALANCE.orderRareMaxDistanceM) continue;
    if (
      distanceM > GAME_BALANCE.orderTypicalMaxDistanceM &&
      distanceM > maxDist
    ) {
      continue;
    }

    orderCounter += 1;
    const previewClass = pickPreviewClass(requirements.requiredClass);
    const lifetime = GAME_BALANCE.orderLifetimeGameMs;
    const district = getDistrictForPoint(from, cityId);
    const isPremierOnly =
      requirements.requiredClass === 'premier' &&
      Math.random() < TIME_WEATHER_BALANCE.premierOrderChance;
    const fareMultiplier =
      district.fareMultiplier *
      (isPremierOnly ? TIME_WEATHER_BALANCE.premierFareBonus : 1);
    const baseFare = calcOrderFare(distanceM, previewClass);
    const isSpecial =
      requirements.requiresChildSeat || requirements.requiresPetCarrier;
    const fare = Math.round(
      baseFare *
        fareMultiplier *
        (isSpecial ? TAXI_UPGRADES_BALANCE.specialOrderFareBonus : 1),
    );

    return {
      id: `order-${orderCounter}`,
      from: zoned.from,
      to: zoned.to,
      fromLabel: formatAddress(zoned.from),
      toLabel: formatAddress(zoned.to),
      requiredClass: requirements.requiredClass,
      requiresChildSeat: requirements.requiresChildSeat,
      requiresPetCarrier: requirements.requiresPetCarrier,
      fare,
      distanceM,
      tripDurationGameSec: calcTripDurationGameSec(distanceM),
      createdAt: gameTimeMs,
      expiresAt: gameTimeMs + lifetime,
      status: 'pending',
      districtId: district.id,
      fareMultiplier,
    };
  }

  return null;
}
