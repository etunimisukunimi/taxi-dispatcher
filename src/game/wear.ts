import { WEAR_BALANCE, calcWearGainKm } from '../config/wearBalance';
import type { Garage, TaxiUnit } from '../types/game';

export function applyTripWear(
  taxi: TaxiUnit,
  totalDistanceM: number,
  wearMultiplier = 1,
  garage?: Garage,
): { wearPercent: number; needsService: boolean } {
  let mult = wearMultiplier;
  if (garage?.upgrades.carWash) {
    mult *= 1 - WEAR_BALANCE.carWashWearReduction;
  }
  const gain = calcWearGainKm(totalDistanceM, mult);
  const wearPercent = Math.min(
    WEAR_BALANCE.maxWear,
    taxi.wearPercent + gain,
  );
  return {
    wearPercent,
    needsService: wearPercent >= WEAR_BALANCE.maxWear,
  };
}

export function taxiNeedsMaintenance(taxi: TaxiUnit): boolean {
  return taxi.isBroken || taxi.needsService;
}
