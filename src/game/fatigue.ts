import { GAME_BALANCE } from '../config/gameBalance';
import type { Driver } from '../types/game';

export function getFatigueBreakThreshold(skillLevel: number): number {
  return Math.max(
    50,
    GAME_BALANCE.fatigueBreakThreshold - skillLevel * 2,
  );
}

export function getSkillSpeedMultiplier(skillLevel: number): number {
  return 1 + (skillLevel - 1) * GAME_BALANCE.skillSpeedBonusPerLevel;
}

export function getFatigueSpeedMultiplier(fatigue: number): number {
  if (fatigue < 40) return 1;
  if (fatigue < 60) return 0.92;
  if (fatigue < 80) return 0.78;
  return 0.62;
}

export function getDriverSpeedMps(
  driver: Driver,
  speedMultiplier: number,
  worldSpeedMult = 1,
): number {
  return (
    GAME_BALANCE.baseSpeedMps *
    getSkillSpeedMultiplier(driver.skillLevel) *
    getFatigueSpeedMultiplier(driver.fatigue) *
    speedMultiplier *
    worldSpeedMult
  );
}

export function calcTripFatigueGain(
  totalDistanceM: number,
  skillLevel: number,
  fatigueMultiplier = 1,
): number {
  const km = totalDistanceM / 1000;
  const skillFactor = Math.max(
    0.5,
    1 - (skillLevel - 1) * GAME_BALANCE.fatigueSkillReductionPerLevel,
  );
  const raw =
    (GAME_BALANCE.fatigueBasePerTrip + km * GAME_BALANCE.fatiguePerKm) *
    skillFactor *
    fatigueMultiplier;
  return Math.min(
    GAME_BALANCE.fatigueMaxPerTrip,
    Math.max(1, Math.round(raw)),
  );
}

export function applyTripFatigue(
  driver: Driver,
  totalDistanceM: number,
  fatigueMultiplier = 1,
): Driver {
  const gain = calcTripFatigueGain(
    totalDistanceM,
    driver.skillLevel,
    fatigueMultiplier,
  );
  return {
    ...driver,
    fatigue: Math.min(100, driver.fatigue + gain),
  };
}

export function shouldBreakAfterTrip(driver: Driver): boolean {
  return driver.fatigue >= getFatigueBreakThreshold(driver.skillLevel);
}

export function recoverFatigue(
  driver: Driver,
  gameDtSec: number,
): Driver {
  const drop =
    GAME_BALANCE.fatigueBreakRecoveryPerGameSec * gameDtSec;
  return {
    ...driver,
    fatigue: Math.max(0, driver.fatigue - drop),
  };
}

export function canUpgradeDriver(skillLevel: number): boolean {
  return skillLevel < GAME_BALANCE.maxSkillLevel;
}
