export const RATING_BALANCE = {
  startRating: 70,
  minRating: 0,
  maxRating: 100,
  tripCompleteGain: 2,
  rejectPenalty: 4,
  breakdownPenalty: 1,
  /** Множитель интервала спавна: 1.2 при 0 рейтинге → 0.75 при 100 */
  spawnIntervalMinMult: 0.75,
  spawnIntervalMaxMult: 1.25,
} as const;

export function clampRating(rating: number): number {
  return Math.max(
    RATING_BALANCE.minRating,
    Math.min(RATING_BALANCE.maxRating, Math.round(rating)),
  );
}

export function getRatingSpawnIntervalMultiplier(rating: number): number {
  const t = clampRating(rating) / RATING_BALANCE.maxRating;
  const { spawnIntervalMinMult, spawnIntervalMaxMult } = RATING_BALANCE;
  return spawnIntervalMaxMult - t * (spawnIntervalMaxMult - spawnIntervalMinMult);
}

/** 0 = только эконом, 1 = больше премиум */
export function getRatingClassBias(rating: number): number {
  return clampRating(rating) / RATING_BALANCE.maxRating;
}

export function formatParkRatingStars(rating: number): string {
  const stars = (clampRating(rating) / 20).toFixed(1);
  return `★ ${stars}`;
}
