import type { GarageTier, OfficeTier } from '../types/game';

export const REAL_ESTATE_BALANCE = {
  maxGarages: 3,
  initialGarageTier: 'garage_5' as GarageTier,
  initialGarageName: 'Гараж',
  garageSellRefundRatio: 0.6,
  officeSellRefundRatio: 0.6,
  garageCapacity: {
    garage_5: 5,
    garage_10: 10,
    garage_15: 15,
  } satisfies Record<GarageTier, number>,
  garagePrices: {
    garage_5: 25_000,
    garage_10: 55_000,
    garage_15: 95_000,
  } satisfies Record<GarageTier, number>,
  garageUpkeepPerDay: {
    garage_5: 80,
    garage_10: 140,
    garage_15: 220,
  } satisfies Record<GarageTier, number>,
  garageTierLabels: {
    garage_5: 'Гараж на 5 машин',
    garage_10: 'Гараж на 10 машин',
    garage_15: 'Гараж на 15 машин',
  } satisfies Record<GarageTier, string>,
  officePrices: {
    office_small: 40_000,
    office_medium: 75_000,
    office_large: 120_000,
  } satisfies Record<OfficeTier, number>,
  officeUpkeepPerDay: {
    office_small: 150,
    office_medium: 280,
    office_large: 450,
  } satisfies Record<OfficeTier, number>,
  officeTierLabels: {
    office_small: 'Офис (малый)',
    office_medium: 'Офис (средний)',
    office_large: 'Офис (большой)',
  } satisfies Record<OfficeTier, string>,
} as const;

export function getGaragePrice(tier: GarageTier): number {
  return REAL_ESTATE_BALANCE.garagePrices[tier];
}

export function getGarageSellRefund(tier: GarageTier): number {
  return Math.round(
    REAL_ESTATE_BALANCE.garagePrices[tier] *
      REAL_ESTATE_BALANCE.garageSellRefundRatio,
  );
}

export function getOfficePrice(tier: OfficeTier): number {
  return REAL_ESTATE_BALANCE.officePrices[tier];
}

export function getOfficeSellRefund(tier: OfficeTier): number {
  return Math.round(
    REAL_ESTATE_BALANCE.officePrices[tier] *
      REAL_ESTATE_BALANCE.officeSellRefundRatio,
  );
}
