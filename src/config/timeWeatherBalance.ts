export type TimeOfDayBand = 'night' | 'morning' | 'day' | 'evening';

export const TIME_WEATHER_BALANCE = {
  eveningSpawnMult: 0.75,
  nightSpawnMult: 1.35,
  nightClassBiasBonus: -0.15,
  eveningClassBiasBonus: 0.1,
  rainSpeedMult: 0.85,
  rainWearMult: 1.1,
  rainFatigueMult: 1.12,
  snowSpeedMult: 0.75,
  snowWearMult: 1.15,
  snowFatigueMult: 1.08,
  premierOrderChance: 0.04,
  premierFareBonus: 1.25,
} as const;

export function getTimeOfDayBand(gameTimeMs: number): TimeOfDayBand {
  const totalMin = Math.floor(gameTimeMs / 60_000) % (24 * 60);
  const hour = Math.floor(totalMin / 60);
  if (hour >= 22 || hour < 6) return 'night';
  if (hour < 10) return 'morning';
  if (hour < 18) return 'day';
  return 'evening';
}

export function getTimeOfDayLabel(band: TimeOfDayBand): string {
  switch (band) {
    case 'night':
      return 'Ночь';
    case 'morning':
      return 'Утро';
    case 'day':
      return 'День';
    case 'evening':
      return 'Вечер';
  }
}

export function getTimeOfDayBanner(band: TimeOfDayBand): string | null {
  if (band === 'evening') return 'Вечерний час — повышенный спрос';
  if (band === 'night') return 'Ночь — заказов меньше';
  return null;
}

export function getWeatherLabel(weather: 'clear' | 'rain' | 'snow'): string {
  switch (weather) {
    case 'clear':
      return 'Ясно';
    case 'rain':
      return 'Дождь';
    case 'snow':
      return 'Снег';
  }
}
