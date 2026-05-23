import type { GarageUpgradeKind } from '../types/game';

export const GARAGE_UPGRADES_BALANCE = {
  carWashPrice: 15_000,
  tireServicePrice: 12_000,
  carWashUpkeepPerDay: 100,
  tireServiceUpkeepPerDay: 130,
} as const;

export function getGarageUpgradeUpkeepPerDay(kind: GarageUpgradeKind): number {
  return kind === 'carWash'
    ? GARAGE_UPGRADES_BALANCE.carWashUpkeepPerDay
    : GARAGE_UPGRADES_BALANCE.tireServiceUpkeepPerDay;
}

export function calcGarageUpgradesUpkeepPerDay(garage: {
  upgrades?: { carWash: boolean; tireService: boolean };
}): number {
  const upgrades = garage.upgrades ?? { carWash: false, tireService: false };
  let total = 0;
  if (upgrades.carWash) total += getGarageUpgradeUpkeepPerDay('carWash');
  if (upgrades.tireService) total += getGarageUpgradeUpkeepPerDay('tireService');
  return total;
}

export function getGarageUpgradePrice(kind: GarageUpgradeKind): number {
  return kind === 'carWash'
    ? GARAGE_UPGRADES_BALANCE.carWashPrice
    : GARAGE_UPGRADES_BALANCE.tireServicePrice;
}

export const GARAGE_UPGRADE_LABELS: Record<GarageUpgradeKind, string> = {
  carWash: 'Автомойка',
  tireService: 'Шиномонтаж',
};

export const GARAGE_UPGRADE_HINTS: Record<GarageUpgradeKind, string> = {
  carWash: 'Машины в этом гараже изнашиваются на 30% медленнее.',
  tireService: 'Меньше поломок и дешевле техобслуживание для машин гаража.',
};
