import { ModalPortal } from './ModalPortal';

type ConfirmDialogProps = {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Да',
  cancelLabel = 'Нет',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
          className="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-message"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p id="confirm-dialog-message" className="confirm-dialog__message">
            {message}
          </p>
          <div className="confirm-dialog__actions">
            <button type="button" className="btn btn--outline" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button type="button" className="btn btn--accent" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
