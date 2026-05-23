import { STAFF_BALANCE } from './staffBalance';

export const GARAGE_SERVICE_BALANCE = {
  /** Базовая длительность обслуживания в гараже (игровые часы → мс) */
  baseServiceDurationGameMs: 3 * 60 * 60 * 1000,
  /** Сокращение длительности за уровень механика (12% → до потолка) */
  durationReductionPerMechanicLevel: 0.12,
  maxDurationReduction: 0.5,
  wearAfterServiceMaxPercent: 30,
  wearAfterServiceMinPercent: 1,
  mechanicHireCost: 10_000,
  mechanicSalaryPerDay: 320,
  mechanicUpgradeBaseCost: 600,
} as const;

export function getGarageServiceDurationGameMs(mechanicLevel: number): number {
  const reduction = Math.min(
    GARAGE_SERVICE_BALANCE.maxDurationReduction,
    mechanicLevel * GARAGE_SERVICE_BALANCE.durationReductionPerMechanicLevel,
  );
  return Math.round(
    GARAGE_SERVICE_BALANCE.baseServiceDurationGameMs * (1 - reduction),
  );
}

export function getWearAfterGarageService(mechanicLevel: number): number {
  const maxLevel = STAFF_BALANCE.maxLevel;
  const level = Math.max(0, Math.min(mechanicLevel, maxLevel));
  const range =
    GARAGE_SERVICE_BALANCE.wearAfterServiceMaxPercent -
    GARAGE_SERVICE_BALANCE.wearAfterServiceMinPercent;
  return Math.round(
    GARAGE_SERVICE_BALANCE.wearAfterServiceMaxPercent -
      (level / maxLevel) * range,
  );
}

export function getGarageMechanicHireCost(): number {
  return GARAGE_SERVICE_BALANCE.mechanicHireCost;
}

export function getGarageMechanicUpgradeCost(level: number): number {
  return GARAGE_SERVICE_BALANCE.mechanicUpgradeBaseCost * level;
}

export function getGarageMechanicSalaryPerDay(level: number): number {
  return GARAGE_SERVICE_BALANCE.mechanicSalaryPerDay * level;
}
