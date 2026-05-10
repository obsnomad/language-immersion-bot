import type { LearningLanguage } from './types';

const storageKey = 'language-immersion-miniapp-learning-language';

export function readStoredLearningLanguage(): LearningLanguage | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === 'en' || value === 'es' ? value : null;
  } catch {
    return null;
  }
}

export function saveStoredLearningLanguage(language: LearningLanguage): void {
  window.localStorage.setItem(storageKey, language);
}
