import {
  RATING_BALANCE,
  clampRating,
} from '../config/ratingBalance';

export function applyRatingDelta(current: number, delta: number): number {
  return clampRating(current + delta);
}

export { clampRating, RATING_BALANCE };
