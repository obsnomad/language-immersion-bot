import type { User } from '@/shared/api';
import WebApp from '@twa-dev/sdk';
import type { ThemeParams } from '@twa-dev/types';

import type { TelegramUser } from './types';

export type TelegramColorScheme = 'light' | 'dark';
export interface TelegramThemeSettings {
  colorScheme: TelegramColorScheme;
  themeParams: Partial<ThemeParams>;
}

function getTelegramWebApp() {
  if (typeof window === 'undefined') {
    return WebApp;
  }

  // @ts-expect-error This is intentional
  return window.Telegram?.WebApp ?? WebApp;
}

export function getTelegramInitData() {
  return getTelegramWebApp().initData?.trim() || '';
}

export function getTelegramThemeSettings(): TelegramThemeSettings {
  const telegramWebApp = getTelegramWebApp();

  return {
    colorScheme: telegramWebApp.colorScheme === 'dark' ? 'dark' : 'light',
    themeParams: telegramWebApp.themeParams ?? {},
  };
}

export function formatViewer(user: TelegramUser | User | null) {
  if (user?.username) {
    return `@${user.username}`;
  }

  const firstName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return firstName || 'Learner';
}

export function initTelegramWebApp() {
  const telegramWebApp = getTelegramWebApp();
  telegramWebApp.ready?.();
  telegramWebApp.expand?.();
}

export function subscribeToTelegramThemeChange(
  listener: (settings: TelegramThemeSettings) => void,
) {
  const telegramWebApp = getTelegramWebApp();
  const handleThemeChanged = () => {
    listener(getTelegramThemeSettings());
  };

  telegramWebApp.onEvent?.('themeChanged', handleThemeChanged);

  return () => {
    telegramWebApp.offEvent?.('themeChanged', handleThemeChanged);
  };
}
