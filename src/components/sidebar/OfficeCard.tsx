import { useState } from 'react';
import { getOfficeAsset } from '../../config/propertyAssets';
import {
  calcOfficeDailyExpense,
  calcOfficeRentPerDay,
} from '../../game/dailyExpenses';
import { calcOfficeStaffSalariesPerDay } from '../../game/staff';
import type { Office } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { OfficeCardMenu } from './OfficeCardMenu';

type OfficeCardProps = {
  office: Office;
};

export function OfficeCard({ office }: OfficeCardProps) {
  const selectOffice = useGameStore((s) => s.selectOffice);
  const selectedOfficeId = useGameStore((s) => s.selectedOfficeId);
  const [menuOpen, setMenuOpen] = useState(false);
  const rent = calcOfficeRentPerDay(office);
  const payroll = calcOfficeStaffSalariesPerDay(office);
  const dailyExpense = calcOfficeDailyExpense(office);
  const expenseBreakdown =
    office.staff.length > 0
      ? `Расходы ${formatMoney(rent)} · ФОТ ${formatMoney(payroll)}`
      : undefined;
  const selected = selectedOfficeId === office.id;

  return (
    <article
      className={`car-card car-card--property${selected ? ' car-card--selected' : ''}`}
      onClick={() => selectOffice(office.id)}
    >
      <div className="car-card__head">
        <img
          src={getOfficeAsset(office.tier)}
          alt=""
          className="car-card__icon"
        />
        <div className="car-card__head-text">
          <div className="car-card__title">{office.name}</div>
        </div>
        <button
          type="button"
          className="car-card__menu-btn"
          aria-label="Настройки офиса"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          ⋯
        </button>
        {menuOpen && (
          <OfficeCardMenu
            officeId={office.id}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
      <div className="car-card__stats">
        <span title={expenseBreakdown}>
          Расходы {formatMoney(dailyExpense)}/день
        </span>
        <span>{office.staff.length} сотр.</span>
      </div>
    </article>
  );
}
