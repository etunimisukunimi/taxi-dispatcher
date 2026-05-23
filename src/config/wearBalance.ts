export const WEAR_BALANCE = {
  wearPerKm: 0.43,
  maxWear: 100,
  serviceCostRatio: 0.35,
  carWashWearReduction: 0.3,
  tireServiceBreakdownReduction: 0.25,
  tireServiceCostReduction: 0.2,
} as const;

export function calcWearGainKm(distanceM: number, wearMultiplier = 1): number {
  const km = distanceM / 1000;
  return Math.min(
    WEAR_BALANCE.maxWear,
    km * WEAR_BALANCE.wearPerKm * wearMultiplier,
  );
}

export function getBreakdownWearMultiplier(wearPercent: number): number {
  return 1 + wearPercent / 50;
}

export function getServiceCost(repairCost: number): number {
  return Math.round(repairCost * WEAR_BALANCE.serviceCostRatio);
}
