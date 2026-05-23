import type { OfficeStaffRole, OfficeTier } from '../types/game';

export const OFFICE_TIER_STAFF_HINTS: Record<OfficeTier, string> = {
  office_small: 'До 1 сотрудника каждой роли (диспетчер, PR).',
  office_medium: 'До 2 сотрудников каждой роли.',
  office_large: 'До 3 сотрудников каждой роли.',
};

export const STAFF_BALANCE = {
  maxLevel: 10,
  hireCost: {
    dispatcher: 12_000,
    pr_manager: 9_000,
  } satisfies Record<OfficeStaffRole, number>,
  salaryPerDay: {
    dispatcher: 350,
    pr_manager: 300,
  } satisfies Record<OfficeStaffRole, number>,
  upgradeBaseCost: 600,
  staffPerRoleByTier: {
    office_small: 1,
    office_medium: 2,
    office_large: 3,
  } satisfies Record<OfficeTier, number>,
  dispatcherTickGameSec: 8,
  dispatcherAcceptBaseChance: 0.12,
  dispatcherAcceptPerLevel: 0.04,
  mechanicBreakdownReductionPerLevel: 0.07,
  mechanicRepairDiscountPerLevel: 0.08,
  prSpawnIntervalReductionPerLevel: 0.06,
  prMaxSpawnReduction: 0.35,
} as const;

export const STAFF_ROLE_LABELS: Record<OfficeStaffRole, string> = {
  dispatcher: 'Диспетчер',
  pr_manager: 'Пиар-менеджер',
};

export const STAFF_ROLE_HINTS: Record<OfficeStaffRole, string> = {
  dispatcher:
    'С некоторой вероятностью принимает заказы и отправляет отдохнувших водителей (усталость 0%) с обеда на линию. Без диспетчера с обеда при 0% усталости выйти нельзя.',
  pr_manager:
    'Ускоряет появление новых заказов — чем выше уровень, тем чаще заявки.',
};

export const GARAGE_MECHANIC_LABEL = 'Механик';
export const GARAGE_MECHANIC_HINT =
  'Снижает вероятность поломки и стоимость ремонта машин этого гаража. Ускоряет обслуживание в гараже и снижает износ после выезда.';

export function getStaffPerRoleLimit(tier: OfficeTier): number {
  return STAFF_BALANCE.staffPerRoleByTier[tier];
}

export function getStaffHireCost(role: OfficeStaffRole): number {
  return STAFF_BALANCE.hireCost[role];
}

export function getStaffUpgradeCost(level: number): number {
  return STAFF_BALANCE.upgradeBaseCost * level;
}

export function getStaffSalaryPerDay(
  role: OfficeStaffRole,
  level: number,
): number {
  return STAFF_BALANCE.salaryPerDay[role] * level;
}
