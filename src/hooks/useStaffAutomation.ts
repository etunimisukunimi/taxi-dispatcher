import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/** Периодическая автоматизация диспетчера (приём заказов, вывод с обеда). */
export function useStaffAutomation() {
  useEffect(() => {
    const tick = () => {
      useGameStore.getState().runStaffAutomation();
    };

    tick();
    const interval = window.setInterval(tick, 3000);
    return () => window.clearInterval(interval);
  }, []);
}
