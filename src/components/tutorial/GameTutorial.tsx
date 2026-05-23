import { useEffect } from 'react';
import { TUTORIAL_STEPS } from '../../config/tutorialSteps';
import { useGameStore } from '../../store/gameStore';
import { TutorialIntroDialog } from './TutorialIntroDialog';
import { TutorialSpotlight } from './TutorialSpotlight';

type GameTutorialProps = {
  isMobile: boolean;
  onMobileFleetOpen: (open: boolean) => void;
  onMobileShopOpen: (open: boolean) => void;
};

export function GameTutorial({
  isMobile,
  onMobileFleetOpen,
  onMobileShopOpen,
}: GameTutorialProps) {
  const tutorialPhase = useGameStore((s) => s.tutorialPhase);
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);
  const startTutorialTour = useGameStore((s) => s.startTutorialTour);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const nextTutorialStep = useGameStore((s) => s.nextTutorialStep);

  const step = TUTORIAL_STEPS[tutorialStepIndex];

  useEffect(() => {
    if (tutorialPhase !== 'tour' || !isMobile || !step) {
      return;
    }
    onMobileFleetOpen(step.mobileOpenFleet === true);
    onMobileShopOpen(step.mobileOpenShop === true);
  }, [
    tutorialPhase,
    tutorialStepIndex,
    isMobile,
    step,
    onMobileFleetOpen,
    onMobileShopOpen,
  ]);

  if (tutorialPhase === 'intro') {
    return (
      <TutorialIntroDialog
        onStartTour={startTutorialTour}
        onSkip={skipTutorial}
      />
    );
  }

  if (tutorialPhase === 'tour') {
    return (
      <TutorialSpotlight
        stepIndex={tutorialStepIndex}
        onNext={nextTutorialStep}
        onSkip={skipTutorial}
      />
    );
  }

  return null;
}
