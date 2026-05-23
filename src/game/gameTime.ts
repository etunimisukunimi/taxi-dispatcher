import { GAME_BALANCE } from '../config/gameBalance';

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

/** Индекс игрового дня (0 = первый день сессии). */
export function getGameDayIndex(gameTimeMs: number): number {
  return Math.floor(gameTimeMs / GAME_BALANCE.gameDayLengthMs);
}

export function getWeekdayLabel(gameTimeMs: number): string {
  const dayIndex = getGameDayIndex(gameTimeMs);
  return WEEKDAY_LABELS[dayIndex % WEEKDAY_LABELS.length]!;
}

export function formatFinanceDayHeader(dayIndex: number): string {
  const ms = dayIndex * GAME_BALANCE.gameDayLengthMs + 12 * 60 * 60 * 1000;
  return `${getWeekdayLabel(ms)}, день ${dayIndex + 1}`;
}
