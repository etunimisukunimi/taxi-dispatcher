import { STAFF_BALANCE, getStaffPerRoleLimit } from '../config/staffBalance';
import type {
  Office,
  OfficeStaffMember,
  OfficeStaffRole,
  TaxiUnit,
} from '../types/game';

export function countStaffByRole(office: Office, role: OfficeStaffRole): number {
  return office.staff.filter((s) => s.role === role).length;
}

export function getStaffByRole(
  office: Office,
  role: OfficeStaffRole,
): OfficeStaffMember[] {
  return office.staff.filter((s) => s.role === role);
}

export function getStaffMemberById(
  office: Office,
  staffId: string,
): OfficeStaffMember | undefined {
  return office.staff.find((s) => s.id === staffId);
}

export function canHireStaffRole(office: Office, role: OfficeStaffRole): boolean {
  return countStaffByRole(office, role) < getStaffPerRoleLimit(office.tier);
}

export function hasStaffRole(offices: Office[], role: OfficeStaffRole): boolean {
  return offices.some((o) => o.staff.some((s) => s.role === role));
}

export function getBestStaffLevel(
  offices: Office[],
  role: OfficeStaffRole,
): number {
  let best = 0;
  for (const office of offices) {
    for (const member of office.staff) {
      if (member.role === role && member.level > best) {
        best = member.level;
      }
    }
  }
  return best;
}

export function getDispatcherAcceptChance(offices: Office[]): number {
  const level = getBestStaffLevel(offices, 'dispatcher');
  if (level <= 0) return 0;
  return (
    STAFF_BALANCE.dispatcherAcceptBaseChance +
    level * STAFF_BALANCE.dispatcherAcceptPerLevel
  );
}

export function getOrderSpawnIntervalMultiplier(offices: Office[]): number {
  const level = getBestStaffLevel(offices, 'pr_manager');
  if (level <= 0) return 1;
  const reduction = Math.min(
    STAFF_BALANCE.prMaxSpawnReduction,
    level * STAFF_BALANCE.prSpawnIntervalReductionPerLevel,
  );
  return 1 - reduction;
}

export function calcOfficeStaffSalariesPerDay(office: Office): number {
  let total = 0;
  for (const member of office.staff) {
    total += STAFF_BALANCE.salaryPerDay[member.role] * member.level;
  }
  return total;
}

export function calcStaffSalariesPerDay(offices: Office[]): number {
  let total = 0;
  for (const office of offices) {
    total += calcOfficeStaffSalariesPerDay(office);
  }
  return total;
}

export function canUpgradeStaff(level: number): boolean {
  return level < STAFF_BALANCE.maxLevel;
}

export function findTaxisForDispatcherEndBreak(fleet: TaxiUnit[]): TaxiUnit[] {
  return fleet.filter(
    (t) =>
      t.status === 'on_break' &&
      !t.isBroken &&
      t.driver.fatigue === 0 &&
      !t.assignedOrderId,
  );
}

let staffCounter = 0;

export function createStaffMember(role: OfficeStaffRole): OfficeStaffMember {
  staffCounter += 1;
  return {
    id: `staff-${staffCounter}`,
    role,
    level: 1,
  };
}
