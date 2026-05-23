import { TUTORIAL_INTRO } from '../../config/tutorialSteps';
import { ModalPortal } from '../ui/ModalPortal';

type TutorialIntroDialogProps = {
  onStartTour: () => void;
  onSkip: () => void;
};

export function TutorialIntroDialog({
  onStartTour,
  onSkip,
}: TutorialIntroDialogProps) {
  return (
    <ModalPortal>
      <div
        className="tutorial-intro-overlay"
        role="presentation"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="tutorial-intro-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-intro-title"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="tutorial-intro-title" className="tutorial-intro-dialog__title">
            {TUTORIAL_INTRO.title}
          </h2>
          <p className="tutorial-intro-dialog__body">{TUTORIAL_INTRO.body}</p>
          <p className="tutorial-intro-dialog__question">Пройти обучение?</p>
          <div className="tutorial-intro-dialog__actions">
            <button type="button" className="btn btn--ghost" onClick={onSkip}>
              Пропустить
            </button>
            <button type="button" className="btn btn--accent" onClick={onStartTour}>
              Да, показать
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
