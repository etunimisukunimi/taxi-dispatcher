import type { CarClass } from '../config/carAssets';
import { CAR_CLASS_ORDER } from '../config/carAssets';
import { getRatingClassBias } from '../config/ratingBalance';
import { TIME_WEATHER_BALANCE, getTimeOfDayBand } from '../config/timeWeatherBalance';
import type { GameEvent, Weather } from '../types/game';

export type WorldModifiers = {
  spawnIntervalMult: number;
  classBias: number;
  speedMult: number;
  wearMult: number;
  fatigueMult: number;
  maxRouteM: number | null;
  ratingBonusPerTrip: number;
  eventSpawnMult: number;
  eventDistrictId: string | null;
};

export function getWorldModifiers(
  gameTimeMs: number,
  weather: Weather,
  parkRating: number,
  activeEvent: GameEvent | null,
): WorldModifiers {
  const band = getTimeOfDayBand(gameTimeMs);
  let spawnIntervalMult = 1;
  let classBias = getRatingClassBias(parkRating);

  if (band === 'evening') {
    spawnIntervalMult *= TIME_WEATHER_BALANCE.eveningSpawnMult;
    classBias += TIME_WEATHER_BALANCE.eveningClassBiasBonus;
  } else if (band === 'night') {
    spawnIntervalMult *= TIME_WEATHER_BALANCE.nightSpawnMult;
    classBias += TIME_WEATHER_BALANCE.nightClassBiasBonus;
  }

  let speedMult = 1;
  let wearMult = 1;
  let fatigueMult = 1;
  if (weather === 'rain') {
    speedMult *= TIME_WEATHER_BALANCE.rainSpeedMult;
    wearMult *= TIME_WEATHER_BALANCE.rainWearMult;
    fatigueMult *= TIME_WEATHER_BALANCE.rainFatigueMult;
  } else if (weather === 'snow') {
    speedMult *= TIME_WEATHER_BALANCE.snowSpeedMult;
    wearMult *= TIME_WEATHER_BALANCE.snowWearMult;
    fatigueMult *= TIME_WEATHER_BALANCE.snowFatigueMult;
  }

  let maxRouteM: number | null = null;
  let ratingBonusPerTrip = 0;
  let eventSpawnMult = 1;
  let eventDistrictId: string | null = null;

  if (activeEvent && activeEvent.endsAtGameMs > gameTimeMs) {
    if (activeEvent.spawnMult) eventSpawnMult = activeEvent.spawnMult;
    if (activeEvent.districtId) eventDistrictId = activeEvent.districtId;
    if (activeEvent.maxRouteM) maxRouteM = activeEvent.maxRouteM;
    if (activeEvent.ratingBonusPerTrip) {
      ratingBonusPerTrip = activeEvent.ratingBonusPerTrip;
    }
  }

  return {
    spawnIntervalMult,
    classBias: Math.max(0, Math.min(1, classBias)),
    speedMult,
    wearMult,
    fatigueMult,
    maxRouteM,
    ratingBonusPerTrip,
    eventSpawnMult,
    eventDistrictId,
  };
}

export function pickWeightedCarClass(classBias: number): CarClass | null {
  if (Math.random() < 0.35) return null;
  if (Math.random() < TIME_WEATHER_BALANCE.premierOrderChance) {
    return 'premier';
  }

  const idx = Math.floor(
  Math.pow(Math.random(), 1.4 - classBias * 0.8) * CAR_CLASS_ORDER.length,
  );
  return CAR_CLASS_ORDER[Math.min(idx, CAR_CLASS_ORDER.length - 1)]!;
}

export function pickWeatherForDay(): Weather {
  const roll = Math.random();
  if (roll < 0.12) return 'rain';
  if (roll < 0.15) return 'snow';
  return 'clear';
}
