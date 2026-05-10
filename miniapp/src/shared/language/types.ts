export const learningLanguages = ['en', 'es'] as const;

export type LearningLanguage = (typeof learningLanguages)[number];

export const learningLanguageLabels: Record<LearningLanguage, string> = {
  en: 'EN',
  es: 'ES',
};
