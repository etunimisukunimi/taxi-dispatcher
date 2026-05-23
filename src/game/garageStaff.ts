import { STAFF_BALANCE } from '../config/staffBalance';
import {
  getGarageMechanicSalaryPerDay,
  getGarageMechanicUpgradeCost,
} from '../config/garageServiceBalance';
import type { Garage, GarageMechanic } from '../types/game';

export function getGarageMechanicLevel(garage: Garage): number {
  return garage.mechanic?.level ?? 0;
}

export function canHireGarageMechanic(garage: Garage): boolean {
  return garage.mechanic === null;
}

export function canUpgradeGarageMechanic(garage: Garage): boolean {
  const level = garage.mechanic?.level ?? 0;
  return level > 0 && level < STAFF_BALANCE.maxLevel;
}

export function getBreakdownChanceMultiplierForGarage(garage: Garage): number {
  const level = getGarageMechanicLevel(garage);
  if (level <= 0) return 1;
  return Math.max(
    0.25,
    1 - level * STAFF_BALANCE.mechanicBreakdownReductionPerLevel,
  );
}

export function getRepairCostMultiplierForGarage(garage: Garage): number {
  const level = getGarageMechanicLevel(garage);
  if (level <= 0) return 1;
  return Math.max(
    0.35,
    1 - level * STAFF_BALANCE.mechanicRepairDiscountPerLevel,
  );
}

export function calcGarageMechanicSalaryPerDay(garage: Garage): number {
  const level = garage.mechanic?.level ?? 0;
  if (level <= 0) return 0;
  return getGarageMechanicSalaryPerDay(level);
}

export { getGarageMechanicUpgradeCost };

let garageMechanicCounter = 0;

export function resetGarageMechanicIdCounter(): void {
  garageMechanicCounter = 0;
}

export function createGarageMechanic(): GarageMechanic {
  garageMechanicCounter += 1;
  return {
    id: `garage-mechanic-${garageMechanicCounter}`,
    level: 1,
  };
}
