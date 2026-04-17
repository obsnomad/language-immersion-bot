import type { StoredSession } from '@/shared/api';

const sessionStorageKey = 'language-immersion-miniapp-session';

export function readStoredSession(): StoredSession | null {
  try {
    const rawValue = window.sessionStorage.getItem(sessionStorageKey);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredSession>;
    if (!parsed?.accessToken || !parsed?.expiresAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredSession): void {
  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

export function clearStoredSession(): void {
  window.sessionStorage.removeItem(sessionStorageKey);
}

export function isSessionExpired(session: StoredSession): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return Date.now() >= expiresAt - 15_000;
}
