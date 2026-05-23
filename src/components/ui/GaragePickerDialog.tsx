import type { Garage } from '../../types/game';
import { ModalPortal } from './ModalPortal';

export type GaragePickerOption = {
  garage: Garage;
  label: string;
  disabled?: boolean;
};

type GaragePickerDialogProps = {
  open: boolean;
  title?: string;
  options: GaragePickerOption[];
  onSelect: (garageId: string) => void;
  onCancel: () => void;
};

export function GaragePickerDialog({
  open,
  title = 'Перегнать в гараж',
  options,
  onSelect,
  onCancel,
}: GaragePickerDialogProps) {
  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className="confirm-dialog-overlay"
        role="presentation"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onCancel}
      >
        <div
          className="confirm-dialog garage-picker-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="garage-picker-title"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="garage-picker-title" className="prompt-dialog__title">
            {title}
          </h3>
          <ul className="garage-picker-dialog__list">
            {options.map(({ garage, label, disabled }) => (
              <li key={garage.id}>
                <button
                  type="button"
                  className="garage-picker-dialog__item"
                  disabled={disabled}
                  onClick={() => onSelect(garage.id)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <div className="confirm-dialog__actions">
            <button
              type="button"
              className="btn btn--outline btn--block"
              onClick={onCancel}
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
