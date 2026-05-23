import type { CarClass } from '../../config/carAssets';

type OrderExpiryRingProps = {
  createdAt: number;
  expiresAt: number;
  gameTimeMs: number;
  selected?: boolean;
};

const SIZE = 36;
const R = 15;
const C = 2 * Math.PI * R;

export function orderExpiryProgress(
  createdAt: number,
  expiresAt: number,
  gameTimeMs: number,
): number {
  const total = expiresAt - createdAt;
  if (total <= 0) return 0;
  const left = Math.max(0, expiresAt - gameTimeMs);
  return Math.min(1, left / total);
}

function timerStroke(progress: number): string {
  const hue = Math.round(progress * 120);
  return `hsl(${hue}, 70%, 42%)`;
}

export function createOrderMarkerHtml(
  progress: number,
  selected: boolean,
  carClass: CarClass,
): string {
  const offset = C * (1 - progress);
  const stroke = timerStroke(progress);

  return `<div class="order-marker-wrap ${selected ? 'order-marker-wrap--selected' : ''}">
    <svg class="order-marker__timer" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
      <circle class="order-marker__timer-bg" cx="18" cy="18" r="${R}" />
      <circle class="order-marker__timer-fg" cx="18" cy="18" r="${R}"
        stroke="${stroke}"
        stroke-dasharray="${C.toFixed(2)}"
        stroke-dashoffset="${offset.toFixed(2)}"
        transform="rotate(-90 18 18)" />
    </svg>
    <div class="order-marker order-marker--${carClass}">📞</div>
  </div>`;
}

/** Обновление кольца таймера без пересоздания divIcon */
export function applyOrderMarkerTimerDom(
  root: HTMLElement,
  progress: number,
  selected: boolean,
): void {
  const wrap = root.querySelector('.order-marker-wrap');
  if (wrap) {
    wrap.classList.toggle('order-marker-wrap--selected', selected);
  }
  const fg = root.querySelector('.order-marker__timer-fg');
  if (fg instanceof SVGCircleElement) {
    const offset = C * (1 - progress);
    fg.setAttribute('stroke', timerStroke(progress));
    fg.setAttribute('stroke-dashoffset', offset.toFixed(2));
  }
}

export function OrderExpiryRing({
  createdAt,
  expiresAt,
  gameTimeMs,
}: OrderExpiryRingProps) {
  const progress = orderExpiryProgress(createdAt, expiresAt, gameTimeMs);

  return (
    <svg
      className="order-expiry-ring"
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden
    >
      <circle className="order-expiry-ring__bg" cx={18} cy={18} r={R} />
      <circle
        className="order-expiry-ring__fg"
        cx={18}
        cy={18}
        r={R}
        style={{
          strokeDasharray: C,
          strokeDashoffset: C * (1 - progress),
          stroke: `hsl(${Math.round(progress * 120)}, 70%, 42%)`,
        }}
      />
    </svg>
  );
}

export { SIZE as ORDER_MARKER_SIZE };
