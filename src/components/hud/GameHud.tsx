import { FinancePanel } from './FinancePanel';
import { SettingsDialog } from './SettingsDialog';
import { useEffect, useState } from 'react';
import { CAR_INFO_ASSETS } from '../../config/carAssets';
import { SETTINGS_ICON } from '../../config/uiAssets';
import { TIME_MODE_TOOLTIPS } from '../../game/timeScaleTooltips';
import { useGameStore } from '../../store/gameStore';
import type { TimeScaleMode } from '../../types/game';
import { TooltipHint } from '../ui/TooltipHint';
import { formatParkRatingStars } from '../../config/ratingBalance';
import { getTimeOfDayBanner, getTimeOfDayBand, getWeatherLabel } from '../../config/timeWeatherBalance';
import { formatGameDateTime, formatMoney } from '../../utils/format';

const TIME_MODES: TimeScaleMode[] = ['irl', 1, 5, 10];

const TIME_MODE_LABELS: Record<TimeScaleMode, string> = {
  irl: 'IRL',
  1: '×1',
  5: '×5',
  10: '×10',
};

export function GameHud() {
  const money = useGameStore((s) => s.money);
  const gameTimeMs = useGameStore((s) => s.gameTimeMs);
  const timeScaleMode = useGameStore((s) => s.timeScaleMode);
  const setTimeScaleMode = useGameStore((s) => s.setTimeScaleMode);
  const networkError = useGameStore((s) => s.networkError);
  const dailyExpenseBanner = useGameStore((s) => s.dailyExpenseBanner);
  const clearDailyExpenseBanner = useGameStore((s) => s.clearDailyExpenseBanner);
  const eventBanner = useGameStore((s) => s.eventBanner);
  const clearEventBanner = useGameStore((s) => s.clearEventBanner);
  const parkRating = useGameStore((s) => s.parkRating);
  const weather = useGameStore((s) => s.weather);
  const openFinancePanel = useGameStore((s) => s.openFinancePanel);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const timeBand = getTimeOfDayBand(gameTimeMs);
  const timeBanner = getTimeOfDayBanner(timeBand);

  useEffect(() => {
    if (dailyExpenseBanner === null) return;
    const t = window.setTimeout(() => clearDailyExpenseBanner(), 4000);
    return () => window.clearTimeout(t);
  }, [dailyExpenseBanner, clearDailyExpenseBanner]);

  useEffect(() => {
    if (eventBanner === null) return;
    const t = window.setTimeout(() => clearEventBanner(), 6000);
    return () => window.clearTimeout(t);
  }, [eventBanner, clearEventBanner]);

  return (
    <>
      <header className="game-hud">
        <div className="game-hud__left">
          <button
            type="button"
            className="game-hud__settings-btn"
            aria-label="Настройки"
            data-tutorial="hud-settings"
            onClick={() => setSettingsOpen(true)}
          >
            <img
              src={SETTINGS_ICON}
              alt=""
              className="game-hud__settings-icon"
            />
          </button>
          <img
            src={CAR_INFO_ASSETS.premier}
            alt="Taxi"
            className="game-hud__logo"
          />
        </div>

        <div className="game-hud__center">
          <div className="hud-primary" data-tutorial="hud-stats">
            <span className="hud-time">{formatGameDateTime(gameTimeMs)}</span>
            <span className="hud-separator" aria-hidden="true" />
            <span
              className="hud-weather"
              title={`Погода: ${getWeatherLabel(weather)}`}
            >
              {weather === 'rain' ? '🌧' : weather === 'snow' ? '❄' : '☀'}
            </span>
            <span className="hud-separator" aria-hidden="true" />
            <span
              className="hud-rating"
              title={`Рейтинг парка: ${parkRating}/100`}
            >
              {formatParkRatingStars(parkRating)}
            </span>
            <span className="hud-separator" aria-hidden="true" />
            <button
              type="button"
              className="hud-money"
              onClick={openFinancePanel}
              title="История доходов и расходов"
            >
              {formatMoney(money)}
            </button>
          </div>
          {timeBanner && (
            <span className="game-hud__expense-banner">{timeBanner}</span>
          )}
          {eventBanner !== null && (
            <span className="game-hud__expense-banner game-hud__event-banner">
              {eventBanner}
            </span>
          )}
          {dailyExpenseBanner !== null && (
            <span className="game-hud__expense-banner">
              Суточные расходы: −{formatMoney(dailyExpenseBanner)}
            </span>
          )}
          <div className="game-hud__speed" data-tutorial="hud-speed">
            {TIME_MODES.map((m) => (
              <button
                key={String(m)}
                type="button"
                className={`speed-btn speed-btn--with-hint ${timeScaleMode === m ? 'speed-btn--active' : ''}`}
                onClick={() => setTimeScaleMode(m)}
              >
                <span className="speed-btn__label">{TIME_MODE_LABELS[m]}</span>
                <TooltipHint
                  text={TIME_MODE_TOOLTIPS[m]}
                  variant={timeScaleMode === m ? 'accent' : 'surface'}
                  className="tooltip-hint--inline tooltip-hint--compact"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="game-hud__right">
          {networkError && (
            <span className="game-hud__error">Проблема с сетью / маршрутами</span>
          )}
        </div>
      </header>
      <FinancePanel />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
