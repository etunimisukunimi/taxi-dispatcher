import {
  getStaffHireCost,
  getStaffPerRoleLimit,
  getStaffSalaryPerDay,
  getStaffUpgradeCost,
  STAFF_ROLE_HINTS,
  STAFF_ROLE_LABELS,
} from '../../config/staffBalance';
import { getOfficeAsset } from '../../config/propertyAssets';
import {
  canHireStaffRole,
  canUpgradeStaff,
  countStaffByRole,
  getStaffByRole,
} from '../../game/staff';
import type { OfficeStaffRole } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { TooltipHint } from '../ui/TooltipHint';

const STAFF_ROLES: OfficeStaffRole[] = ['dispatcher', 'pr_manager'];

export function OfficeStaffTab() {
  const selectedOfficeId = useGameStore((s) => s.selectedOfficeId);
  const offices = useGameStore((s) => s.offices);
  const money = useGameStore((s) => s.money);
  const hireStaff = useGameStore((s) => s.hireStaff);
  const upgradeStaff = useGameStore((s) => s.upgradeStaff);

  const office = offices.find((o) => o.id === selectedOfficeId);
  if (!office) {
    return (
      <p className="shop-sidebar__hint shop-sidebar__list">
        Выберите офис на вкладке «Офисы» слева.
      </p>
    );
  }

  const perRoleLimit = getStaffPerRoleLimit(office.tier);
  const officeIcon = getOfficeAsset(office.tier);

  return (
    <div className="shop-sidebar__list">
      <p className="shop-sidebar__hint">{office.name}</p>

      {STAFF_ROLES.map((role) => {
        const hired = getStaffByRole(office, role);
        const count = countStaffByRole(office, role);
        const canHire = canHireStaffRole(office, role);
        const hireCost = getStaffHireCost(role);
        const hireSalaryPerDay = getStaffSalaryPerDay(role, 1);
        const hireMoneyHint =
          canHire && money < hireCost
            ? `Недостаточно средств (${formatMoney(hireCost)})`
            : undefined;

        return (
          <article key={role} className="car-card car-card--shop">
            <div className="car-card__head">
              <img
                src={officeIcon}
                alt=""
                className="car-card__icon"
              />
              <div className="car-card__head-text">
                <div className="car-card__title car-card__title--with-hint">
                  {STAFF_ROLE_LABELS[role]}
                  <TooltipHint
                    text={STAFF_ROLE_HINTS[role]}
                    variant="surface"
                    className="tooltip-hint--inline tooltip-hint--compact"
                  />
                </div>
                <div className="car-card__status">
                  {count}/{perRoleLimit} нанято
                </div>
              </div>
            </div>

            {hired.length > 0 ? (
              <ul className="office-staff-tab__hired">
                {hired.map((member) => {
                  const upgradeCost = getStaffUpgradeCost(member.level);
                  const atMaxLevel = !canUpgradeStaff(member.level);
                  const canUpgrade =
                    !atMaxLevel && money >= upgradeCost;
                  const upgradeMoneyHint =
                    !atMaxLevel && money < upgradeCost
                      ? `Недостаточно средств (${formatMoney(upgradeCost)})`
                      : undefined;
                  const salaryPerDay = getStaffSalaryPerDay(
                    member.role,
                    member.level,
                  );
                  const salaryDeltaPerDay = atMaxLevel
                    ? 0
                    : getStaffSalaryPerDay(member.role, member.level + 1) -
                      salaryPerDay;

                  return (
                    <li key={member.id} className="office-staff-tab__member">
                      <span>
                        Ур. {member.level} · {formatMoney(salaryPerDay)}/день
                      </span>
                      <div className="office-staff-tab__member-actions">
                        <button
                          type="button"
                          className="btn btn--outline btn--sm office-staff-tab__upgrade-btn"
                          disabled={atMaxLevel || !canUpgrade}
                          title={upgradeMoneyHint}
                          onClick={() => upgradeStaff(office.id, member.id)}
                        >
                          {atMaxLevel
                            ? 'Максимальный уровень'
                            : `Улучшить · ${formatMoney(upgradeCost)}`}
                        </button>
                        {!atMaxLevel && salaryDeltaPerDay > 0 ? (
                          <span className="office-staff-tab__salary-delta">
                            +{formatMoney(salaryDeltaPerDay)}/день
                          </span>
                        ) : null}
                        {upgradeMoneyHint ? (
                          <TooltipHint
                            text={upgradeMoneyHint}
                            variant="surface"
                            className="tooltip-hint--inline tooltip-hint--compact"
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div
              className={
                hireMoneyHint
                  ? 'car-card__actions car-card__actions--with-hint'
                  : 'car-card__actions'
              }
            >
              <button
                type="button"
                className="btn btn--accent btn--block shop-item-card__action-btn"
                disabled={!canHire || money < hireCost}
                title={hireMoneyHint}
                onClick={() => hireStaff(office.id, role)}
              >
                {!canHire
                  ? 'Мест нет'
                  : `Нанять · ${formatMoney(hireCost)}`}
              </button>
              {hireMoneyHint ? (
                <TooltipHint
                  text={hireMoneyHint}
                  variant="accent"
                  className="tooltip-hint--inline tooltip-hint--compact shop-item-card__action-hint"
                />
              ) : null}
            </div>
            {canHire ? (
              <p className="office-staff-tab__hire-salary">
                +{formatMoney(hireSalaryPerDay)}/день к расходам офиса
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
