import { GAME_BALANCE } from '../config/gameBalance';
import type { TimeScaleMode } from '../types/game';

const base = GAME_BALANCE.gameSecondsPerRealSecond;

export const TIME_MODE_TOOLTIPS: Record<TimeScaleMode, string> = {
  irl:
    'Реальное время: 1 реальная секунда = 1 игровая. Часы и машины без ускорения.',
  1: `Ускорение ×1: за 1 реальную секунду проходит ${base} игровых секунд (~${base / 60} игр. мин).`,
  5: `Ускорение ×5: за 1 реальную секунду — ${base * 5} игровых секунд (~${(base * 5) / 60} игр. мин).`,
  10: `Ускорение ×10: за 1 реальную секунду — ${base * 10} игровых секунд (~${(base * 10) / 60} игр. мин).`,
};
