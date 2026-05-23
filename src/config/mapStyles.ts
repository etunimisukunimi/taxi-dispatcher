export type MapStyleId = 'positron' | 'voyager' | 'dark';

export type MapStyleConfig = {
  id: MapStyleId;
  name: string;
  url: string;
  attribution: string;
};

export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
  positron: {
    id: 'positron',
    name: 'Светлый минимализм',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  voyager: {
    id: 'voyager',
    name: 'Светлый с подписями',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    id: 'dark',
    name: 'Тёмный',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

/** Стиль по умолчанию — близок к навигаторам такси (светлый, без лишних деталей) */
export const DEFAULT_MAP_STYLE_ID: MapStyleId = 'positron';

export function getMapStyle(id: MapStyleId = DEFAULT_MAP_STYLE_ID): MapStyleConfig {
  return MAP_STYLES[id];
}

/** Игровое время: с 20:00 до 6:00 — тёмная карта, днём — выбор игрока */
export function getEffectiveMapStyleId(
  gameTimeMs: number,
  userStyleId: MapStyleId,
): MapStyleId {
  const hour = Math.floor((gameTimeMs / 3_600_000) % 24);
  if (hour >= 20 || hour < 6) return 'dark';
  return userStyleId;
}

const MAP_STYLE_STORAGE_KEY = 'taxi-dispatcher-map-style';

export function loadStoredMapStyleId(): MapStyleId {
  try {
    const stored = localStorage.getItem(MAP_STYLE_STORAGE_KEY);
    if (stored && stored in MAP_STYLES) {
      return stored as MapStyleId;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MAP_STYLE_ID;
}

export function storeMapStyleId(id: MapStyleId): void {
  try {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export const MAP_STYLE_IDS: MapStyleId[] = ['positron', 'voyager', 'dark'];
