import { createContext, useContext } from 'react';

import type {
  PracticeMessageResponse,
  Profile,
  ProgressSummary,
  ReviewItem,
  StoredSession,
} from '@/shared/api';
import type { LearningLanguage } from '@/shared/language/types';

export interface DailyPlanItem {
  id: string;
  title: string;
  detail: string;
  kind: 'review' | 'scenario' | 'vocabulary';
}

export interface QuickAction {
  id: string;
  label: string;
  path: string;
}

export interface LanguageScopeState {
  profile: Profile | null;
  reviewItems: ReviewItem[];
  summary: ProgressSummary;
  practiceInput: string;
  practiceResult: PracticeMessageResponse | null;
  dailyPlan: DailyPlanItem[];
  weakTopics: string[];
  quickActions: QuickAction[];
}

export interface LayoutContextValue {
  session: StoredSession | null;
  currentLanguage: LearningLanguage;
  currentSectionTitle: string;
  availableLanguages: LearningLanguage[];
  isAuthorized: boolean;
  isBootstrapping: boolean;
  isLanguageSwitching: boolean;
  isPracticePending: boolean;
  isReviewPending: boolean;
  status: string;
  statusTone: 'info' | 'warning' | 'error' | 'success';
  languageState: LanguageScopeState;
  switchLanguage: (language: LearningLanguage) => Promise<void>;
  handleRefreshReview: () => Promise<void>;
  handleSubmitPractice: (event: SubmitEvent) => Promise<void>;
  setPracticeInput: (value: string) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export const LayoutContextProvider = LayoutContext.Provider;

export const useLayoutContext = (): LayoutContextValue => {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error('Layout context is not available.');
  }

  return context;
};
