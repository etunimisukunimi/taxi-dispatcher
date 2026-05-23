import type { MouseEvent } from 'react';

export type TooltipHintVariant = 'accent' | 'surface';

type TooltipHintProps = {
  text: string;
  className?: string;
  variant?: TooltipHintVariant;
};

function stopBubble(e: MouseEvent) {
  e.stopPropagation();
  e.preventDefault();
}

/** Компактная метка «?» с нативным тултипом (внутри кнопки — не активирует её) */
export function TooltipHint({
  text,
  className = '',
  variant,
}: TooltipHintProps) {
  const variantClass =
    variant === 'accent'
      ? 'tooltip-hint--on-accent'
      : variant === 'surface'
        ? 'tooltip-hint--on-surface'
        : '';

  return (
    <span
      className={`tooltip-hint ${variantClass} ${className}`.trim()}
      title={text}
      aria-label={text}
      role="note"
      onClick={stopBubble}
      onMouseDown={stopBubble}
    >
      <span className="tooltip-hint__glyph" aria-hidden>
        ?
      </span>
    </span>
  );
}
