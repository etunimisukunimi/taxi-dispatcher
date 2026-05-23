import { useState } from 'react';
import {
  MAP_STYLE_IDS,
  MAP_STYLES,
  type MapStyleId,
} from '../../config/mapStyles';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const RESET_CONFIRM_MESSAGE = 'Весь прогресс будет удалён. Продолжить?';
const DEBUG_MONEY_AMOUNT = 1_000_000;

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const resetProgress = useGameStore((s) => s.resetProgress);
  const addDebugMoney = useGameStore((s) => s.addDebugMoney);
  const mapStyleId = useGameStore((s) => s.mapStyleId);
  const setMapStyleId = useGameStore((s) => s.setMapStyleId);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open && !confirmReset) return null;

  if (confirmReset) {
    return (
      <ConfirmDialog
        open
        message={RESET_CONFIRM_MESSAGE}
        confirmLabel="Сбросить"
        onConfirm={() => {
          resetProgress();
          setConfirmReset(false);
          onClose();
        }}
        onCancel={() => setConfirmReset(false)}
      />
    );
  }

  return (
    <div
      className="finance-panel-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="finance-panel__head">
          <h2 id="settings-dialog-title" className="finance-panel__title">
            Настройки
          </h2>
          <button
            type="button"
            className="finance-panel__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="settings-dialog__body">
          <fieldset className="settings-dialog__fieldset">
            <legend className="settings-dialog__legend">Тема карты</legend>
            <div className="settings-dialog__map-styles">
              {MAP_STYLE_IDS.map((id) => (
                <label key={id} className="settings-dialog__map-style">
                  <input
                    type="radio"
                    name="map-style"
                    value={id}
                    checked={mapStyleId === id}
                    onChange={() => setMapStyleId(id as MapStyleId)}
                  />
                  <span>{MAP_STYLES[id].name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="settings-dialog__actions">
            <button
              type="button"
              className="btn btn--outline btn--block"
              onClick={() => setConfirmReset(true)}
            >
              Сбросить прогресс
            </button>
            <button
              type="button"
              className="btn btn--accent btn--block"
              onClick={() => {
                addDebugMoney(DEBUG_MONEY_AMOUNT);
                onClose();
              }}
            >
              Добавить {formatMoney(DEBUG_MONEY_AMOUNT)} на баланс
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
