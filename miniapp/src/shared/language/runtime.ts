import type { LearningLanguage } from './types';

let activeLearningLanguage: LearningLanguage = 'en';

export function getActiveLearningLanguage(): LearningLanguage {
  return activeLearningLanguage;
}

export function setActiveLearningLanguage(language: LearningLanguage): void {
  activeLearningLanguage = language;
}
