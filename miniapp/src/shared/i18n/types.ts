export const supportedLanguages = ['en', 'ru'] as const;

export type AppLanguage = (typeof supportedLanguages)[number];
