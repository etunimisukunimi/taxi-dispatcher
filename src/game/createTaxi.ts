import type { CarClass } from '../config/carAssets';
import { getCity, type CityId } from '../config/cities';
import type { Driver, LatLng, TaxiUnit } from '../types/game';

let taxiCounter = 0;

export function resetTaxiIdCounter(): void {
  taxiCounter = 0;
}

export function createDriver(skillLevel = 1): Driver {
  return { skillLevel, fatigue: 0 };
}

export function createTaxiUnit(
  carClass: CarClass,
  garageId: string,
  position?: LatLng,
  cityId: CityId = 'kazan',
): TaxiUnit {
  const city = getCity(cityId);
  const pos = position ?? {
    lat: city.center[0],
    lng: city.center[1],
  };
  taxiCounter += 1;

  return {
    id: `taxi-${taxiCounter}`,
    garageId,
    carClass,
    driver: createDriver(1),
    status: 'free',
    tripPhase: null,
    position: pos,
    bearingDeg: 0,
    assignedOrderId: null,
    routePoints: [pos],
    routeFrom: pos,
    routeTo: pos,
    distanceM: 1,
    progressM: 0,
    pickupPoint: null,
    dropoffPoint: null,
    idleUntilGameMs: 0,
    garageUntilGameMs: 0,
    idleLeg: null,
    isBroken: false,
    needsService: false,
    wearPercent: 0,
    pickupLegDistanceM: 0,
    driverName: '',
    upgrades: {
      childSeat: false,
      petCarrier: false,
      lpg: false,
      branding: false,
    },
    positionReady: false,
  };
}
