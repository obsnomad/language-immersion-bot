import { apiRequest } from '../client';
import type { PracticeMessageResponse, ReviewListResponse } from '../types';

export function fetchReviewItems(accessToken: string): Promise<ReviewListResponse> {
  return apiRequest<ReviewListResponse>('/learning/review/today', {}, accessToken);
}

export function submitPracticeMessage(
  accessToken: string,
  text: string,
): Promise<PracticeMessageResponse> {
  return apiRequest<PracticeMessageResponse>(
    '/learning/session/message',
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    },
    accessToken,
  );
}
