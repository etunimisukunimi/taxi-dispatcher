import type { DistrictId } from '../game/districts';
import type { GameEventId } from '../types/game';

export type EventTemplate = {
  id: GameEventId;
  label: string;
  durationGameMs: number;
  districtId?: DistrictId;
  spawnMult?: number;
  ratingBonusPerTrip?: number;
  maxRouteM?: number;
};

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'concert',
    label: 'Концерт в Центре — много заказов',
    durationGameMs: 2 * 60 * 60 * 1000,
    districtId: 'center',
    spawnMult: 2,
  },
  {
    id: 'road_work',
    label: 'Ремонт дорог — короче маршруты',
    durationGameMs: 3 * 60 * 60 * 1000,
    maxRouteM: 6000,
  },
  {
    id: 'weekend_promo',
    label: 'Акция выходного — больше рейтинга за заказы',
    durationGameMs: 4 * 60 * 60 * 1000,
    ratingBonusPerTrip: 1,
  },
];

export function pickRandomEventTemplate(): EventTemplate {
  return EVENT_TEMPLATES[
    Math.floor(Math.random() * EVENT_TEMPLATES.length)
  ]!;
}
