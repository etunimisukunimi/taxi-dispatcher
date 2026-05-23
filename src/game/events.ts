import { pickRandomEventTemplate } from '../config/eventsBalance';
import type { GameEvent } from '../types/game';

export function createDailyEvent(gameTimeMs: number): GameEvent {
  const template = pickRandomEventTemplate();
  return {
    id: template.id,
    label: template.label,
    endsAtGameMs: gameTimeMs + template.durationGameMs,
    districtId: template.districtId,
    spawnMult: template.spawnMult,
    ratingBonusPerTrip: template.ratingBonusPerTrip,
    maxRouteM: template.maxRouteM,
  };
}
