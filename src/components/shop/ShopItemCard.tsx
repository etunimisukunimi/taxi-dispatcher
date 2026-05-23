import type { ReactNode } from 'react';
import { BtnWithHint } from '../ui/BtnWithHint';
import { TooltipHint } from '../ui/TooltipHint';

type ShopItemCardProps = {
  iconSrc: string;
  title: string;
  subtitle: string;
  stats?: ReactNode;
  actionLabel: string;
  disabled?: boolean;
  disabledHint?: string;
  titleHint?: string;
  onAction: () => void;
};

export function ShopItemCard({
  iconSrc,
  title,
  subtitle,
  stats,
  actionLabel,
  disabled = false,
  disabledHint,
  titleHint,
  onAction,
}: ShopItemCardProps) {
  const showDisabledHint = disabled && disabledHint;

  return (
    <article className="car-card car-card--shop">
      <div className="car-card__head">
        <img src={iconSrc} alt="" className="car-card__icon" />
        <div className="car-card__head-text">
          <div
            className={
              titleHint
                ? 'car-card__title car-card__title--with-hint'
                : 'car-card__title'
            }
          >
            {title}
            {titleHint ? (
              <TooltipHint
                text={titleHint}
                variant="surface"
                className="tooltip-hint--inline tooltip-hint--compact"
              />
            ) : null}
          </div>
          <div className="car-card__status">{subtitle}</div>
        </div>
      </div>
      {stats ? <div className="car-card__stats">{stats}</div> : null}
      <div className="car-card__actions car-card__actions--with-hint">
        {showDisabledHint ? (
          <BtnWithHint
            hint={disabledHint}
            hintVariant="accent"
            className="btn btn--accent"
            block
            disabled
          >
            {actionLabel}
          </BtnWithHint>
        ) : (
          <button
            type="button"
            className="btn btn--accent btn--block"
            disabled={disabled}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}
