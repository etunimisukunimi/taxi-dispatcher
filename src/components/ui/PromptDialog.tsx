import { useEffect, useRef, useState } from 'react';
import { ModalPortal } from './ModalPortal';

type PromptDialogProps = {
  open: boolean;
  title: string;
  label?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
};

export function PromptDialog({
  open,
  title,
  label,
  defaultValue = '',
  confirmLabel = 'Сохранить',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open, defaultValue]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <ModalPortal>
      <div
        className="confirm-dialog-overlay"
        role="presentation"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onCancel}
      >
        <div
          className="confirm-dialog prompt-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-dialog-title"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="prompt-dialog-title" className="prompt-dialog__title">
            {title}
          </h3>
          {label ? (
            <label className="prompt-dialog__label">{label}</label>
          ) : null}
          <input
            ref={inputRef}
            type="text"
            className="prompt-dialog__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === 'Escape') onCancel();
            }}
          />
          <div className="confirm-dialog__actions">
            <button type="button" className="btn btn--outline" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="btn btn--accent"
              disabled={!value.trim()}
              onClick={handleSubmit}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
