import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { AppLanguage } from './types';
import { supportedLanguages } from './types';

const supportedLanguageSet = new Set<AppLanguage>(supportedLanguages);

const normalizeLanguage = (value: string | null | undefined): AppLanguage => {
  const shortValue = value?.toLowerCase().slice(0, 2);
  return shortValue && supportedLanguageSet.has(shortValue as AppLanguage)
    ? (shortValue as AppLanguage)
    : 'en';
};

export const profileLanguageToLocale = (nativeLanguage: string | null | undefined): AppLanguage =>
  normalizeLanguage(nativeLanguage);

export const useAppI18n = () => {
  const translation = useTranslation();

  return useMemo(
    () => ({
      ...translation,
      formatDateTime: (value: string | Date) =>
        new Intl.DateTimeFormat(translation.i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value)),
      formatMode: (value: string) =>
        translation.t(`enum.mode.${value}`, {
          defaultValue: value.replace(/_/g, ' '),
        }),
      formatCategory: (value: string) =>
        translation.t(`enum.category.${value}`, {
          defaultValue: value.replace(/_/g, ' '),
        }),
    }),
    [translation],
  );
};
