/** Прямоугольник игровой зоны: юго-запад и северо-восток [lat, lng] */
export type CityBounds = [[number, number], [number, number]];

export type CityConfig = {
  id: string;
  name: string;
  center: [number, number];
  /** Границы города: спавн машин и ограничение панорамирования карты */
  bounds: CityBounds;
  /** Стартовый и максимальный zoom при fitBounds (меньше — дальше от земли) */
  defaultZoom: number;
  /** Минимальный zoom — нельзя «отъехать» слишком далеко от города */
  minZoom: number;
  maxZoom: number;
};

export const CITIES = {
  kazan: {
    id: 'kazan',
    name: 'Казань',
    center: [55.796, 49.106],
    bounds: [
      [55.7, 48.9],
      [55.92, 49.35],
    ],
    defaultZoom: 12,
    minZoom: 12,
    maxZoom: 18,
  },
} as const satisfies Record<string, CityConfig>;

export type CityId = keyof typeof CITIES;

export const DEFAULT_CITY_ID: CityId = 'kazan';

export function getCity(id: CityId = DEFAULT_CITY_ID): CityConfig {
  return CITIES[id];
}

export function listCities(): CityConfig[] {
  return Object.values(CITIES);
}
