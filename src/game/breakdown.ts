import { GAME_BALANCE } from '../config/gameBalance';

export function rollBreakdownAfterTrip(
  chanceMultiplier = 1,
  wearMultiplier = 1,
): boolean {
  const chance =
    GAME_BALANCE.breakdownChancePerTrip * chanceMultiplier * wearMultiplier;
  return Math.random() < chance;
}
