import { calcOrderFare } from '../config/gameBalance';
import { getTaxiFareMultiplier } from '../config/taxiUpgradesBalance';
import { CAR_CLASS_LABELS, isCarClassAtLeast } from '../config/carAssets';
import type { CityBounds } from '../config/cities';
import { applyZoneToTrip } from './applyZoneLimits';
import { buildRouteGeometry } from './carSimulation';
import { fetchRouteQueued } from './routeQueue';
import type { LatLng, Order, TaxiUnit } from '../types/game';
import { haversineMeters } from '../utils/geo';

function taxiUpgrades(taxi: TaxiUnit) {
  return (
    taxi.upgrades ?? {
      childSeat: false,
      petCarrier: false,
      lpg: false,
      branding: false,
    }
  );
}

export function isTaxiEligibleForOrder(
  taxi: TaxiUnit,
  order: Pick<
    Order,
    'requiredClass' | 'requiresChildSeat' | 'requiresPetCarrier'
  >,
): boolean {
  if (!taxi.positionReady) return false;
  if (taxi.isBroken || taxi.needsService) return false;
  if (taxi.status !== 'free') return false;
  const upgrades = taxiUpgrades(taxi);
  if (
    order.requiredClass !== null &&
    !isCarClassAtLeast(taxi.carClass, order.requiredClass)
  ) {
    return false;
  }
  if (order.requiresChildSeat && !upgrades.childSeat) return false;
  if (order.requiresPetCarrier && !upgrades.petCarrier) return false;
  return true;
}

export function findNearestEligibleTaxi(
  fleet: TaxiUnit[],
  point: LatLng,
  order: Pick<
    Order,
    'requiredClass' | 'requiresChildSeat' | 'requiresPetCarrier'
  >,
): TaxiUnit | null {
  const eligible = fleet.filter((t) => isTaxiEligibleForOrder(t, order));
  if (eligible.length === 0) return null;

  let best = eligible[0];
  let bestD = haversineMeters(best.position, point);

  for (let i = 1; i < eligible.length; i++) {
    const d = haversineMeters(eligible[i].position, point);
    if (d < bestD) {
      best = eligible[i];
      bestD = d;
    }
  }

  return best;
}

export function getNearestPickupDistanceM(
  fleet: TaxiUnit[],
  order: Order,
): number | null {
  const taxi = findNearestEligibleTaxi(fleet, order.from, order);
  if (!taxi) return null;
  return haversineMeters(taxi.position, order.from);
}

/** Причина в родительном падеже для «…у вас нет {причина}» */
export function getOrderAcceptBlockReason(
  fleet: TaxiUnit[],
  order: Order,
): string | null {
  if (findNearestEligibleTaxi(fleet, order.from, order)) {
    return null;
  }

  if (fleet.length === 0) {
    return 'машин в автопарке';
  }

  const needsChild = order.requiresChildSeat;
  const needsPet = order.requiresPetCarrier;
  const { requiredClass } = order;

  const freeMatching = fleet.filter((t) => {
    const upgrades = taxiUpgrades(t);
    return (
      t.status === 'free' &&
      !t.isBroken &&
      !t.needsService &&
      (requiredClass === null ||
        isCarClassAtLeast(t.carClass, requiredClass)) &&
      (!needsChild || upgrades.childSeat) &&
      (!needsPet || upgrades.petCarrier)
    );
  });

  if (freeMatching.length > 0) {
    return 'свободной машины рядом с точкой подачи';
  }

  if (needsChild && !fleet.some((t) => taxiUpgrades(t).childSeat)) {
    return 'машины с детским креслом';
  }

  if (needsPet && !fleet.some((t) => taxiUpgrades(t).petCarrier)) {
    return 'машины с переноской для животных';
  }

  if (requiredClass) {
    const classLabel = CAR_CLASS_LABELS[requiredClass];
    const classHint = `класса «${classLabel}» или выше`;
    const hasClass = fleet.some((t) =>
      isCarClassAtLeast(t.carClass, requiredClass),
    );
    if (!hasClass) {
      return `машины ${classHint}`;
    }

    const freeOfClass = fleet.filter(
      (t) =>
        isCarClassAtLeast(t.carClass, requiredClass) && t.status === 'free',
    );
    if (freeOfClass.length === 0) {
      return `свободной машины ${classHint}`;
    }

    if (freeOfClass.every((t) => t.isBroken)) {
      return `исправной машины ${classHint}`;
    }

    if (needsChild) {
      const withSeat = freeOfClass.filter((t) => taxiUpgrades(t).childSeat);
      if (withSeat.length === 0) {
        return `свободной машины ${classHint} с детским креслом`;
      }
    }

    if (needsPet) {
      const withPet = freeOfClass.filter((t) => taxiUpgrades(t).petCarrier);
      if (withPet.length === 0) {
        return `свободной машины ${classHint} с переноской для животных`;
      }
    }

    return `подходящей свободной машины ${classHint}`;
  }

  const free = fleet.filter((t) => t.status === 'free');
  if (free.length === 0) {
    return 'свободных машин';
  }

  if (free.every((t) => t.isBroken)) {
    return 'исправных свободных машин';
  }

  if (needsChild) {
    const withSeat = free.filter((t) => taxiUpgrades(t).childSeat);
    if (withSeat.length === 0) {
      return 'свободной машины с детским креслом';
    }
    if (withSeat.every((t) => t.isBroken)) {
      return 'исправной машины с детским креслом';
    }
  }

  if (needsPet) {
    const withPet = free.filter((t) => taxiUpgrades(t).petCarrier);
    if (withPet.length === 0) {
      return 'свободной машины с переноской для животных';
    }
    if (withPet.every((t) => t.isBroken)) {
      return 'исправной машины с переноской для животных';
    }
  }

  return 'подходящих свободных машин';
}

export function getOrderPreviewFare(order: Order, fleet: TaxiUnit[]): number {
  const taxi = findNearestEligibleTaxi(fleet, order.from, order);
  const carClass = taxi?.carClass ?? order.requiredClass ?? 'econom';
  const base =
    order.fare > 0 ? order.fare : calcOrderFare(order.distanceM, carClass);
  const brandingMult = taxi
    ? getTaxiFareMultiplier(taxiUpgrades(taxi))
    : 1;
  return Math.round(base * brandingMult);
}

export async function buildTaxiRoute(
  _taxi: TaxiUnit,
  from: LatLng,
  to: LatLng,
  playBounds: CityBounds,
): Promise<Partial<TaxiUnit> | null> {
  const raw = await fetchRouteQueued(from, to);
  if (!raw) return null;

  const zoned = applyZoneToTrip(raw, playBounds);
  if (!zoned || zoned.points.length < 2) return null;

  const geometry = buildRouteGeometry(zoned.points);

  return {
    routePoints: zoned.points,
    routeFrom: zoned.from,
    routeTo: zoned.to,
    distanceM: geometry.totalM,
    progressM: 0,
    bearingDeg: 0,
    position: zoned.points[0],
  };
}

export function assignOrderToTaxi(taxi: TaxiUnit, order: Order): TaxiUnit {
  return {
    ...taxi,
    status: 'routing',
    tripPhase: 'to_pickup',
    assignedOrderId: order.id,
    pickupPoint: order.from,
    dropoffPoint: order.to,
    progressM: 0,
    routePoints: [taxi.position],
    distanceM: 1,
    idleLeg: null,
    idleUntilGameMs: 0,
  };
}
