import { GAME_BALANCE, getGamePace } from '../config/gameBalance';
import {
  getFatigueSpeedMultiplier,
  getSkillSpeedMultiplier,
} from '../game/fatigue';
import { getWeekdayLabel } from '../game/gameTime';
import type { Driver, TimeScaleMode } from '../types/game';

export function formatGameTime(gameTimeMs: number): string {
  const totalMin = Math.floor(gameTimeMs / 60_000) % (24 * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatGameDateTime(gameTimeMs: number): string {
  return `${getWeekdayLabel(gameTimeMs)}, ${formatGameTime(gameTimeMs)}`;
}

/** Оставшееся время обслуживания в гараже (игровое или реальное при IRL) */
export function formatGarageServiceRemaining(
  gameTimeMs: number,
  garageUntilGameMs: number,
  timeScaleMode: TimeScaleMode,
): string {
  const remainingGameMs = Math.max(0, garageUntilGameMs - gameTimeMs);
  if (remainingGameMs <= 0) return 'скоро';
  const gameSec = remainingGameMs / 1000;
  if (timeScaleMode === 'irl') {
    return formatDurationHuman(gameSec / getGamePace(timeScaleMode));
  }
  return formatDurationHuman(gameSec);
}

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export function formatDistance(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} км`;
  return `${Math.round(m)} м`;
}

/** Единый формат длительности (секунды → «N сек» / «N мин» / «X ч Y мин») */
export function formatDurationHuman(totalSec: number): string {
  if (totalSec <= 0 || !Number.isFinite(totalSec)) return '—';
  if (totalSec < 45) return `${Math.ceil(totalSec)} сек`;
  const min = Math.ceil(totalSec / 60);
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function driverGameSpeedMps(driver: Driver): number {
  return (
    GAME_BALANCE.baseSpeedMps *
    getSkillSpeedMultiplier(driver.skillLevel) *
    getFatigueSpeedMultiplier(driver.fatigue)
  );
}

/** ETA до точки: игровое время при ×1/×2/×4, реальное при IRL */
export function formatTripEtaRemaining(
  metersLeft: number,
  driver: Driver,
  timeScaleMode: TimeScaleMode,
): string {
  const speed = driverGameSpeedMps(driver);
  if (speed <= 0 || metersLeft <= 0) return '—';

  const gameSec = metersLeft / speed;
  if (timeScaleMode === 'irl') {
    const pace = getGamePace(timeScaleMode);
    return formatDurationHuman(gameSec / pace);
  }
  return formatDurationHuman(gameSec);
}

export function formatEtaSec(metersLeft: number, speedMps: number): string {
  if (speedMps <= 0) return '—';
  return formatDurationHuman(metersLeft / speedMps);
}

/** ETA с учётом ускорения (для превью заказа без конкретного водителя) */
export function formatEtaDisplay(
  metersLeft: number,
  speedMps: number,
  timeScaleMode: TimeScaleMode,
): string {
  if (speedMps <= 0) return '—';
  const gameSec = metersLeft / speedMps;
  if (timeScaleMode === 'irl') {
    const pace = getGamePace(timeScaleMode);
    return formatDurationHuman(gameSec / pace);
  }
  return formatDurationHuman(gameSec);
}
