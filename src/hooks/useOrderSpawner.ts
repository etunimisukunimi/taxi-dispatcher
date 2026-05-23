import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useOrderSpawner() {
  useEffect(() => {
    const interval = setInterval(() => {
      void useGameStore.getState().trySpawnOrder();
    }, 8000);

    void useGameStore.getState().trySpawnOrder();

    return () => clearInterval(interval);
  }, []);
}
