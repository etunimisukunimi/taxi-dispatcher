import { ErrorBoundary } from './components/ErrorBoundary';
import { GameLayout } from './components/layout/GameLayout';
import { CitySetupScreen } from './components/setup/CitySetupScreen';
import { useGameStore } from './store/gameStore';

export default function App() {
  const sessionSetupComplete = useGameStore((s) => s.sessionSetupComplete);

  return (
    <ErrorBoundary>
      {sessionSetupComplete ? <GameLayout /> : <CitySetupScreen />}
    </ErrorBoundary>
  );
}
