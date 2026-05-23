import { REAL_ESTATE_BALANCE } from '../config/realEstateBalance';
import type { Garage, GarageTier, TaxiUnit } from '../types/game';

let garageCounter = 0;

export function resetGarageIdCounter(): void {
  garageCounter = 0;
}

export function getGarageCapacity(tier: GarageTier): number {
  return REAL_ESTATE_BALANCE.garageCapacity[tier];
}

export function createGarage(tier: GarageTier, name: string): Garage {
  garageCounter += 1;
  return {
    id: `garage-${garageCounter}`,
    name,
    tier,
    upgrades: { carWash: false, tireService: false },
    mechanic: null,
  };
}

export function countTaxisInGarage(fleet: TaxiUnit[], garageId: string): number {
  return fleet.filter((t) => t.garageId === garageId).length;
}

export function garageHasSpace(
  garage: Garage,
  fleet: TaxiUnit[],
): boolean {
  return countTaxisInGarage(fleet, garage.id) < getGarageCapacity(garage.tier);
}

export function findGarageWithSpace(
  garages: Garage[],
  fleet: TaxiUnit[],
): Garage | null {
  for (const garage of garages) {
    if (garageHasSpace(garage, fleet)) return garage;
  }
  return null;
}

export function canAddGarage(garages: Garage[]): boolean {
  return garages.length < REAL_ESTATE_BALANCE.maxGarages;
}

export function formatGarageHeader(
  name: string,
  count: number,
  capacity: number,
): string {
  return `Автопарк ${name} ${count}/${capacity}`;
}

export function garagesWithSpace(
  garages: Garage[],
  fleet: TaxiUnit[],
): Garage[] {
  return garages.filter((g) => garageHasSpace(g, fleet));
}
