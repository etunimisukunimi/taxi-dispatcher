import { useMemo } from 'react';
import {
  formatSignedMoney,
  groupFinanceByDay,
} from '../../game/financeLedger';
import { formatFinanceDayHeader } from '../../game/gameTime';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';

export function FinancePanel() {
  const open = useGameStore((s) => s.financePanelOpen);
  const closeFinancePanel = useGameStore((s) => s.closeFinancePanel);
  const money = useGameStore((s) => s.money);
  const ledger = useGameStore((s) => s.financeLedger);

  const days = useMemo(() => groupFinanceByDay(ledger), [ledger]);

  if (!open) return null;

  return (
    <div
      className="finance-panel-overlay"
      role="presentation"
      onClick={closeFinancePanel}
    >
      <div
        className="finance-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="finance-panel__head">
          <div>
            <h2 id="finance-panel-title" className="finance-panel__title">
              Финансы
            </h2>
            <p className="finance-panel__balance">
              Баланс: {formatMoney(money)}
            </p>
          </div>
          <button
            type="button"
            className="finance-panel__close"
            aria-label="Закрыть"
            onClick={closeFinancePanel}
          >
            ×
          </button>
        </header>

        {days.length === 0 ? (
          <p className="finance-panel__empty">
            Пока нет операций. Совершите поездку или купите машину.
          </p>
        ) : (
          <div className="finance-panel__days">
            {days.map((day) => (
              <section
                key={day.gameDayIndex}
                className="finance-panel__day"
              >
                <h3 className="finance-panel__day-title">
                  {formatFinanceDayHeader(day.gameDayIndex)}
                  <span
                    className={`finance-panel__day-total ${day.total >= 0 ? 'finance-panel__day-total--pos' : 'finance-panel__day-total--neg'}`}
                  >
                    {formatSignedMoney(day.total)}
                  </span>
                </h3>
                <ul className="finance-panel__list">
                  {day.lines.map((line) => (
                    <li
                      key={`${day.gameDayIndex}-${line.label}-${line.amount}`}
                      className="finance-panel__row"
                    >
                      <span className="finance-panel__row-label">
                        {line.label}
                      </span>
                      <span
                        className={
                          line.amount >= 0
                            ? 'finance-panel__amount--pos'
                            : 'finance-panel__amount--neg'
                        }
                      >
                        {formatSignedMoney(line.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
