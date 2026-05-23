import type { CarClass } from './carAssets';
import type { TimeScaleMode } from '../types/game';

export const GAME_BALANCE = {
  /** 1 игровая минута = 2 сек реального времени при ×1 (30 игр. сек / 1 реал. сек) */
  gameSecondsPerRealSecond: 30,
  startMoney: 500000,
  baseSpeedMps: 9,
  orderSpawnIntervalGameMs: 180_000,
  maxPendingOrders: 10,
  orderLifetimeGameMs: 900_000,
  orderMinDistanceM: 1_500,
  orderTypicalMaxDistanceM: 8_000,
  orderRareMaxDistanceM: 14_000,
  orderLongRouteChance: 0.08,
  orderSpawnNearFleetChance: 0.75,
  orderSpawnNearRadiusM: 3_500,
  breakdownChancePerTrip: 0.015,
  salaryPerDriverPerDay: 400,
  fuelPerCarPerDay: {
    econom: 120,
    comfort: 150,
    comfort_plus: 180,
    business: 260,
    premier: 220,
  } satisfies Record<CarClass, number>,
  gameDayLengthMs: 86_400_000,
  fatigueEndBreakThreshold: 15,
  baseFare: 120,
  farePerKm: 18,
  classFareMultiplier: {
    econom: 1,
    comfort: 1.15,
    comfort_plus: 1.35,
    business: 1.8,
    premier: 1.55,
  } satisfies Record<CarClass, number>,
  carPrices: {
    econom: 8_000,
    comfort: 10_000,
    comfort_plus: 12_000,
    business: 18_000,
    premier: 28_000,
  } satisfies Record<CarClass, number>,
  driverUpgradeBaseCost: 800,
  fatigueBasePerTrip: 1,
  fatiguePerKm: 0.58,
  fatigueMaxPerTrip: 16,
  fatigueSkillReductionPerLevel: 0.04,
  fatigueBreakThreshold: 72,
  fatigueBreakRecoveryPerGameSec: 0.035,
  skillSpeedBonusPerLevel: 0.04,
  maxSkillLevel: 10,
} as const;

/** Игровых секунд за 1 реальную секунду */
export function getGamePace(mode: TimeScaleMode): number {
  if (mode === 'irl') return 1;
  return GAME_BALANCE.gameSecondsPerRealSecond * mode;
}

export function getCarPrice(carClass: CarClass): number {
  return GAME_BALANCE.carPrices[carClass];
}

export function getRepairCost(carClass: CarClass): number {
  return Math.round(getCarPrice(carClass) / 2);
}

export function getUpgradeCost(skillLevel: number): number {
  return GAME_BALANCE.driverUpgradeBaseCost * skillLevel;
}

export function calcOrderFare(distanceM: number, carClass: CarClass): number {
  const km = distanceM / 1000;
  const mult = GAME_BALANCE.classFareMultiplier[carClass];
  return Math.round(
    (GAME_BALANCE.baseFare + km * GAME_BALANCE.farePerKm) * mult,
  );
}

/** Время поездки в игровых секундах (базовая скорость, без game pace) */
export function calcTripDurationGameSec(distanceM: number): number {
  const speed = GAME_BALANCE.baseSpeedMps;
  if (speed <= 0) return 0;
  return distanceM / speed;
}

export function getOrderFareRange(distanceM: number): {
  min: number;
  max: number;
} {
  return {
    min: calcOrderFare(distanceM, 'econom'),
    max: calcOrderFare(distanceM, 'premier'),
  };
}
