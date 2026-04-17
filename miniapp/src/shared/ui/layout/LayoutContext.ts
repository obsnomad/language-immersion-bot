import { useOutletContext } from 'react-router-dom';

import type { PracticeMessageResponse, ProgressSummary, ReviewItem } from '@/shared/api';

export interface LayoutContextValue {
  isAuthorized: boolean;
  isBootstrapping: boolean;
  isPracticePending: boolean;
  isReviewPending: boolean;
  practiceInput: string;
  practiceResult: PracticeMessageResponse | null;
  reviewItems: ReviewItem[];
  summary: ProgressSummary;
  handleRefreshReview: () => Promise<void>;
  handleSubmitPractice: (event: SubmitEvent) => Promise<void>;
  setPracticeInput: (value: string) => void;
}

export const useLayoutContext = () => useOutletContext<LayoutContextValue>();
