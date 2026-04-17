import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';

import { supportedLanguages } from './types';

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/miniapp/locales/{{lng}}/{{ns}}.json',
    },
    fallbackLng: 'en',
    lng: 'en',
    supportedLngs: supportedLanguages,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export { i18n };
