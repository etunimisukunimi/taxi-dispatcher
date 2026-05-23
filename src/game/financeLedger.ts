import { CAR_CLASS_LABELS, type CarClass } from '../config/carAssets';
import { getGameDayIndex } from './gameTime';
import type {
  FinanceDayGroup,
  FinanceDayLine,
  FinanceEntry,
  FinanceEntryKind,
} from '../types/game';

let financeEntryCounter = 0;

export function createFinanceEntry(
  gameTimeMs: number,
  amount: number,
  kind: FinanceEntryKind,
  label: string,
): FinanceEntry {
  financeEntryCounter += 1;
  return {
    id: `fin-${financeEntryCounter}`,
    gameDayIndex: getGameDayIndex(gameTimeMs),
    gameTimeMs,
    amount,
    kind,
    label,
  };
}

export function carPurchaseLabel(carClass: CarClass): string {
  return `Покупка ${CAR_CLASS_LABELS[carClass].toLowerCase()} такси`;
}

function mergeDayEntries(entries: FinanceEntry[]): FinanceDayLine[] {
  const lines: FinanceDayLine[] = [];
  const tripTotal = entries
    .filter((e) => e.kind === 'trip_income')
    .reduce((sum, e) => sum + e.amount, 0);

  if (tripTotal !== 0) {
    lines.push({ label: 'Заказы за сутки', amount: tripTotal });
  }

  for (const e of entries) {
    if (e.kind === 'trip_income') continue;
    lines.push({ label: e.label, amount: e.amount });
  }

  return lines;
}

/** Группировка записей по игровым дням (новые дни сверху) */
export function groupFinanceByDay(ledger: FinanceEntry[]): FinanceDayGroup[] {
  const byDay = new Map<number, FinanceEntry[]>();

  for (const entry of ledger) {
    const list = byDay.get(entry.gameDayIndex) ?? [];
    list.push(entry);
    byDay.set(entry.gameDayIndex, list);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => b - a)
    .map(([gameDayIndex, entries]) => {
      const sorted = [...entries].sort((a, b) => a.gameTimeMs - b.gameTimeMs);
      const lines = mergeDayEntries(sorted);
      const total = lines.reduce((sum, l) => sum + l.amount, 0);
      return { gameDayIndex, lines, total };
    });
}

export function formatSignedMoney(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('ru-RU');
  if (amount > 0) return `+${abs} ₽`;
  if (amount < 0) return `−${abs} ₽`;
  return `${abs} ₽`;
}
