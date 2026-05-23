import type { CityBounds, CityId } from './cities';

const SESSION_STORAGE_KEY = 'taxi-dispatcher-session-v1';

export type SessionData = {
  setupComplete: boolean;
  cityId: CityId;
  customBounds: CityBounds | null;
};

/** @deprecated Сессия города больше не сохраняется между заходами */
export function loadSession(): SessionData | null {
  return null;
}

/** @deprecated */
export function saveSession(_data: SessionData): void {
  /* no-op */
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
