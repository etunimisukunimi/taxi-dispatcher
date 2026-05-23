import {
  GARAGE_UPGRADE_HINTS,
  GARAGE_UPGRADE_LABELS,
  getGarageUpgradePrice,
  getGarageUpgradeUpkeepPerDay,
} from '../../config/garageUpgradesBalance';
import {
  GARAGE_MECHANIC_HINT,
  GARAGE_MECHANIC_LABEL,
} from '../../config/staffBalance';
import {
  getGarageMechanicHireCost,
  getGarageMechanicSalaryPerDay,
  getGarageMechanicUpgradeCost,
} from '../../config/garageServiceBalance';
import { getGarageAsset } from '../../config/propertyAssets';
import { STAFF_BALANCE } from '../../config/staffBalance';
import {
  canHireGarageMechanic,
  canUpgradeGarageMechanic,
} from '../../game/garageStaff';
import { useGameStore } from '../../store/gameStore';
import type { GarageUpgradeKind } from '../../types/game';
import { formatMoney } from '../../utils/format';
import { TooltipHint } from '../ui/TooltipHint';

const GARAGE_UPGRADE_KINDS: GarageUpgradeKind[] = ['carWash', 'tireService'];

export function GarageUpgradesTab() {
  const selectedGarageId = useGameStore((s) => s.selectedGarageId);
  const garages = useGameStore((s) => s.garages);
  const money = useGameStore((s) => s.money);
  const buyGarageUpgrade = useGameStore((s) => s.buyGarageUpgrade);
  const hireGarageMechanic = useGameStore((s) => s.hireGarageMechanic);
  const upgradeGarageMechanic = useGameStore((s) => s.upgradeGarageMechanic);

  const garage = garages.find((g) => g.id === selectedGarageId);
  if (!garage) {
    return (
      <p className="shop-sidebar__hint shop-sidebar__list">
        Выберите гараж на вкладке «Автопарки» слева.
      </p>
    );
  }

  const upgrades = garage.upgrades ?? { carWash: false, tireService: false };
  const garageIcon = getGarageAsset(garage.tier);
  const mechanic = garage.mechanic;
  const canHire = canHireGarageMechanic(garage);
  const hireCost = getGarageMechanicHireCost();
  const hireMoneyHint =
    canHire && money < hireCost
      ? `Недостаточно средств (${formatMoney(hireCost)})`
      : undefined;
  const atMaxMechanic =
    mechanic !== null && mechanic.level >= STAFF_BALANCE.maxLevel;
  const mechanicUpgradeCost = mechanic
    ? getGarageMechanicUpgradeCost(mechanic.level)
    : 0;
  const canUpgradeMechanic =
    mechanic !== null && canUpgradeGarageMechanic(garage);
  const upgradeMoneyHint =
    canUpgradeMechanic && !atMaxMechanic && money < mechanicUpgradeCost
      ? `Недостаточно средств (${formatMoney(mechanicUpgradeCost)})`
      : undefined;
  const mechanicSalaryPerDay = mechanic
    ? getGarageMechanicSalaryPerDay(mechanic.level)
    : getGarageMechanicSalaryPerDay(1);
  const mechanicSalaryDelta =
    mechanic && !atMaxMechanic
      ? getGarageMechanicSalaryPerDay(mechanic.level + 1) - mechanicSalaryPerDay
      : 0;

  return (
    <div className="shop-sidebar__list">
      <p className="shop-sidebar__hint">{garage.name}</p>

      <article className="car-card car-card--shop">
        <div className="car-card__head">
          <img src={garageIcon} alt="" className="car-card__icon" />
          <div className="car-card__head-text">
            <div className="car-card__title car-card__title--with-hint">
              {GARAGE_MECHANIC_LABEL}
              <TooltipHint
                text={GARAGE_MECHANIC_HINT}
                variant="surface"
                className="tooltip-hint--inline tooltip-hint--compact"
              />
            </div>
            <div className="car-card__status">
              {mechanic ? `Ур. ${mechanic.level}` : 'Не нанят'}
            </div>
          </div>
        </div>

        {mechanic ? (
          <ul className="office-staff-tab__hired">
            <li className="office-staff-tab__member">
              <span>
                Ур. {mechanic.level} · {formatMoney(mechanicSalaryPerDay)}/день
              </span>
              <div className="office-staff-tab__member-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm office-staff-tab__upgrade-btn"
                  disabled={atMaxMechanic || !canUpgradeMechanic || money < mechanicUpgradeCost}
                  title={upgradeMoneyHint}
                  onClick={() => upgradeGarageMechanic(garage.id)}
                >
                  {atMaxMechanic
                    ? 'Максимальный уровень'
                    : `Улучшить · ${formatMoney(mechanicUpgradeCost)}`}
                </button>
                {!atMaxMechanic && mechanicSalaryDelta > 0 ? (
                  <span className="office-staff-tab__salary-delta">
                    +{formatMoney(mechanicSalaryDelta)}/день
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
          </ul>
        ) : (
          <>
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
                onClick={() => hireGarageMechanic(garage.id)}
              >
                {`Нанять · ${formatMoney(hireCost)}`}
              </button>
              {hireMoneyHint ? (
                <TooltipHint
                  text={hireMoneyHint}
                  variant="accent"
                  className="tooltip-hint--inline tooltip-hint--compact shop-item-card__action-hint"
                />
              ) : null}
            </div>
            <p className="office-staff-tab__hire-salary">
              +{formatMoney(mechanicSalaryPerDay)}/день к расходам гаража
            </p>
          </>
        )}
      </article>

      {GARAGE_UPGRADE_KINDS.map((kind) => {
        const owned = upgrades[kind];
        const price = getGarageUpgradePrice(kind);
        const upkeepPerDay = getGarageUpgradeUpkeepPerDay(kind);
        const moneyHint =
          !owned && money < price
            ? `Недостаточно средств (${formatMoney(price)})`
            : undefined;

        return (
          <article key={kind} className="car-card car-card--shop">
            <div className="car-card__head">
              <img src={garageIcon} alt="" className="car-card__icon" />
              <div className="car-card__head-text">
                <div className="car-card__title car-card__title--with-hint">
                  {GARAGE_UPGRADE_LABELS[kind]}
                  <TooltipHint
                    text={GARAGE_UPGRADE_HINTS[kind]}
                    variant="surface"
                    className="tooltip-hint--inline tooltip-hint--compact"
                  />
                </div>
                <div className="car-card__status">
                  {owned ? 'Установлено' : 'Не установлено'}
                </div>
              </div>
            </div>

            {!owned ? (
              <>
                <div
                  className={
                    moneyHint
                      ? 'car-card__actions car-card__actions--with-hint'
                      : 'car-card__actions'
                  }
                >
                  <button
                    type="button"
                    className="btn btn--accent btn--block shop-item-card__action-btn"
                    disabled={money < price}
                    title={moneyHint}
                    onClick={() => buyGarageUpgrade(garage.id, kind)}
                  >
                    {`Купить · ${formatMoney(price)}`}
                  </button>
                  {moneyHint ? (
                    <TooltipHint
                      text={moneyHint}
                      variant="accent"
                      className="tooltip-hint--inline tooltip-hint--compact shop-item-card__action-hint"
                    />
                  ) : null}
                </div>
                <p className="office-staff-tab__hire-salary">
                  +{formatMoney(upkeepPerDay)}/день к расходам гаража
                </p>
              </>
            ) : (
              <p className="office-staff-tab__hire-salary">
                {formatMoney(upkeepPerDay)}/день к расходам гаража
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
