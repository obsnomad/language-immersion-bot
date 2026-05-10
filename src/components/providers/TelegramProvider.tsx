'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string };
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

interface TelegramCtx {
  twa: TelegramWebApp | null;
  initData: string | null;
  colorScheme: 'light' | 'dark';
  isReady: boolean;
}

const Ctx = createContext<TelegramCtx>({ twa: null, initData: null, colorScheme: 'light', isReady: false });

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TelegramCtx>({
    twa: null,
    initData: null,
    colorScheme: 'light',
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const initialize = () => {
      if (cancelled) return;

      const twa = window.Telegram?.WebApp ?? null;
      attempts += 1;

      if (!twa && attempts < 20) {
        window.setTimeout(initialize, 100);
        return;
      }

      if (twa) {
        twa.ready();
        twa.expand();
        document.documentElement.classList.toggle('dark', twa.colorScheme === 'dark');
      }

      setState({
        twa,
        initData: twa?.initData || null,
        colorScheme: twa?.colorScheme ?? 'light',
        isReady: true,
      });
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useTelegram = () => useContext(Ctx);
