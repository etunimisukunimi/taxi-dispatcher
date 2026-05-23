import type { ReactNode } from 'react';
import { TooltipHint, type TooltipHintVariant } from './TooltipHint';

type BtnWithHintProps = {
  children: ReactNode;
  hint?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  block?: boolean;
  hintVariant?: TooltipHintVariant;
};

/** Кнопка со знаком «?» внутри */
export function BtnWithHint({
  children,
  hint,
  className = 'btn btn--accent',
  disabled,
  onClick,
  block,
  hintVariant = 'accent',
}: BtnWithHintProps) {
  const classes = [
    className,
    block ? 'btn--block' : '',
    hint ? 'btn--with-hint' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="btn__label">{children}</span>
      {hint ? (
        <TooltipHint
          text={hint}
          variant={hintVariant}
          className="tooltip-hint--inline tooltip-hint--compact"
        />
      ) : null}
    </button>
  );
}
