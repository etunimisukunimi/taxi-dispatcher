import { useState } from 'react';
import { getGarageAsset } from '../../config/propertyAssets';
import { calcGarageUpgradesUpkeepPerDay } from '../../config/garageUpgradesBalance';
import {
  calcGarageDailyExpense,
  calcGarageFleetOperatingPerDay,
  calcGarageRentPerDay,
} from '../../game/dailyExpenses';
import {
  countTaxisInGarage,
  getGarageCapacity,
} from '../../game/garage';
import { calcGarageMechanicSalaryPerDay } from '../../game/garageStaff';
import { useGameStore } from '../../store/gameStore';
import type { Garage, TaxiUnit } from '../../types/game';
import { formatMoney } from '../../utils/format';
import { GarageSectionMenu } from './GarageSectionMenu';

type GarageCardProps = {
  garage: Garage;
  fleet: TaxiUnit[];
  expanded: boolean;
  onToggleExpand: () => void;
};

export function GarageCard({
  garage,
  fleet,
  expanded,
  onToggleExpand,
}: GarageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const selectGarage = useGameStore((s) => s.selectGarage);
  const selectedGarageId = useGameStore((s) => s.selectedGarageId);
  const count = countTaxisInGarage(fleet, garage.id);
  const capacity = getGarageCapacity(garage.tier);
  const rent = calcGarageRentPerDay(garage);
  const fleetCost = calcGarageFleetOperatingPerDay(garage, fleet);
  const upkeep = calcGarageUpgradesUpkeepPerDay(garage);
  const mechanicPay = calcGarageMechanicSalaryPerDay(garage);
  const dailyExpense = calcGarageDailyExpense(garage, fleet);
  const selected = selectedGarageId === garage.id;

  const breakdownParts = [`Расходы ${formatMoney(rent)}`];
  if (count > 0) {
    breakdownParts.push(`Автопарк ${formatMoney(fleetCost)}`);
  }
  if (upkeep > 0) {
    breakdownParts.push(`Сервис ${formatMoney(upkeep)}`);
  }
  if (mechanicPay > 0) {
    breakdownParts.push(`Механик ${formatMoney(mechanicPay)}`);
  }
  const expenseBreakdown = breakdownParts.join(' · ');

  return (
    <article
      className={`car-card car-card--property${selected ? ' car-card--selected' : ''}`}
      onClick={() => selectGarage(garage.id)}
    >
      <div className="car-card__head">
        <img
          src={getGarageAsset(garage.tier)}
          alt=""
          className="car-card__icon"
        />
        <div className="car-card__head-text">
          <div className="car-card__title">{garage.name}</div>
        </div>
        <button
          type="button"
          className="fleet-garage-section__toggle car-card__menu-btn"
          aria-label={expanded ? 'Свернуть список машин' : 'Развернуть список машин'}
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="car-card__menu-btn"
          aria-label="Настройки гаража"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ⋯
        </button>
        {menuOpen && (
          <GarageSectionMenu
            garageId={garage.id}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
      <div className="car-card__stats">
        <span>
          Машин {count}/{capacity}
        </span>
        {garage.mechanic ? (
          <span>Механик ур. {garage.mechanic.level}</span>
        ) : null}
        <span title={expenseBreakdown}>
          Расходы {formatMoney(dailyExpense)}/день
        </span>
      </div>
    </article>
  );
}
