export const TAXI_UPGRADES_BALANCE = {
  childSeatPrice: 3_500,
  petCarrierPrice: 2_800,
  lpgPrice: 4_500,
  brandingPrice: 6_000,
  lpgFuelReduction: 0.4,
  brandingFareBonus: 1.1,
  /** Доля заказов с особыми требованиями (остальное — обычные) */
  specialOrderChance: 0.07,
  childSeatOrderShare: 0.55,
  petCarrierOrderShare: 0.45,
  specialOrderFareBonus: 1.12,
} as const;

export function getChildSeatPrice(): number {
  return TAXI_UPGRADES_BALANCE.childSeatPrice;
}

export function getPetCarrierPrice(): number {
  return TAXI_UPGRADES_BALANCE.petCarrierPrice;
}

export function getLpgPrice(): number {
  return TAXI_UPGRADES_BALANCE.lpgPrice;
}

export function getBrandingPrice(): number {
  return TAXI_UPGRADES_BALANCE.brandingPrice;
}

export function getTaxiFareMultiplier(upgrades: {
  branding: boolean;
}): number {
  return upgrades.branding ? TAXI_UPGRADES_BALANCE.brandingFareBonus : 1;
}

export function getTaxiFuelMultiplier(upgrades: {
  lpg: boolean;
}, carClass: string): number {
  if (carClass !== 'econom' || !upgrades.lpg) return 1;
  return 1 - TAXI_UPGRADES_BALANCE.lpgFuelReduction;
}
