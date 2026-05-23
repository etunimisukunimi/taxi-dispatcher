import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import type { TutorialStep } from '../../config/tutorialSteps';
import { TUTORIAL_STEPS } from '../../config/tutorialSteps';
import { ModalPortal } from '../ui/ModalPortal';

const SPOTLIGHT_PADDING = 10;
const VIEWPORT_MARGIN = 16;
const TOOLTIP_MAX_WIDTH = 400;

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TutorialSpotlightProps = {
  stepIndex: number;
  onNext: () => void;
  onSkip: () => void;
};

function measureTarget(selector: string): SpotlightRect | null {
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: Math.max(8, r.top - SPOTLIGHT_PADDING),
    left: Math.max(8, r.left - SPOTLIGHT_PADDING),
    width: r.width + SPOTLIGHT_PADDING * 2,
    height: r.height + SPOTLIGHT_PADDING * 2,
  };
}

/** Карточка всегда внизу экрана — не перекрывается подсвеченным UI и не уезжает за край. */
function getTooltipStyle(): CSSProperties {
  const vw = window.innerWidth;
  const maxWidth = Math.min(TOOLTIP_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2);
  return {
    left: '50%',
    bottom: VIEWPORT_MARGIN,
    transform: 'translateX(-50%)',
    maxWidth,
    width: maxWidth,
  };
}

export function TutorialSpotlight({
  stepIndex,
  onNext,
  onSkip,
}: TutorialSpotlightProps) {
  const step: TutorialStep = TUTORIAL_STEPS[stepIndex]!;
  const total = TUTORIAL_STEPS.length;
  const isLast = stepIndex >= total - 1;
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const updateRect = useCallback(() => {
    const next = measureTarget(step.target);
    setRect(next);
    if (next) {
      document
        .querySelector(`[data-tutorial="${step.target}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [step.target]);

  useEffect(() => {
    updateRect();
    const t = window.setTimeout(updateRect, 320);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect, stepIndex, step.target]);

  const tooltipStyle = getTooltipStyle();

  return (
    <ModalPortal>
      <div className="tutorial-spotlight" role="presentation">
        {rect ? (
          <div
            className="tutorial-spotlight__hole"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            aria-hidden
          />
        ) : (
          <div className="tutorial-spotlight__dim" aria-hidden />
        )}

        <div
          className="tutorial-spotlight__card"
          style={tooltipStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-step-title"
        >
          <p className="tutorial-spotlight__progress">
            Шаг {stepIndex + 1} из {total}
          </p>
          <h3 id="tutorial-step-title" className="tutorial-spotlight__title">
            {step.title}
          </h3>
          <p className="tutorial-spotlight__body">{step.body}</p>
          <div className="tutorial-spotlight__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onSkip}>
              Пропустить
            </button>
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={onNext}
            >
              {isLast ? 'Начать игру' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
