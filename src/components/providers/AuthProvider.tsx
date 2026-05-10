'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useTelegram } from './TelegramProvider';
import type { LanguageCode, LanguageProfile, User } from '@/types';

interface AuthCtx {
  token: string | null;
  user: User | null;
  profile: LanguageProfile | null;
  language: LanguageCode;
  isLoading: boolean;
  isAuthorized: boolean;
  setLanguage: (lang: LanguageCode) => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  token: null,
  user: null,
  profile: null,
  language: 'en',
  isLoading: true,
  isAuthorized: false,
  setLanguage: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initData, isReady } = useTelegram();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<LanguageProfile | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  const hydrateSession = useCallback(async (activeToken: string, lang: LanguageCode) => {
    const [profileRes, userRes] = await Promise.all([
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${activeToken}`, 'X-Language': lang },
      }),
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${activeToken}` },
      }),
    ]);

    if (profileRes.status === 401 || userRes.status === 401) {
      throw new Error('stored session expired');
    }

    if (profileRes.ok) setProfile(await profileRes.json());
    if (userRes.ok) setUser(await userRes.json());
  }, []);

  const authenticate = useCallback(
    async (lang: LanguageCode) => {
      const stored = localStorage.getItem('session_token');
      const expiry = localStorage.getItem('session_expiry');

      if (stored && expiry && Date.now() < parseInt(expiry, 10)) {
        setToken(stored);
        try {
          await hydrateSession(stored, lang);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('session_token');
          localStorage.removeItem('session_expiry');
          setToken(null);
          setUser(null);
          setProfile(null);
        }
      }

      if (!initData) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/telegram-mini-app', {
          method: 'POST',
          headers: { Authorization: `tma ${initData}`, 'X-Language': lang },
        });

        if (!res.ok) throw new Error('auth failed');

        const data = await res.json();
        const ttl = 86400 * 1000;
        localStorage.setItem('session_token', data.token);
        localStorage.setItem('session_expiry', String(Date.now() + ttl));
        setToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        console.error('TMA auth failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateSession, initData],
  );

  useEffect(() => {
    if (!isReady) return;
    setIsLoading(true);
    authenticate(language);
  }, [isReady, authenticate, language]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}`, 'X-Language': language },
    });
    if (res.ok) setProfile(await res.json());
  }, [token, language]);

  const handleSetLanguage = useCallback((lang: LanguageCode) => {
    setLanguage(lang);
  }, []);

  return (
    <Ctx.Provider
      value={{
        token,
        user,
        profile,
        language,
        isLoading,
        isAuthorized: Boolean(token),
        setLanguage: handleSetLanguage,
        refreshProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
