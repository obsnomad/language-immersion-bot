import { apiRequest } from '../client';
import type { ProgressSummary } from '../types';

export function fetchProgressSummary(accessToken: string): Promise<ProgressSummary> {
  return apiRequest<ProgressSummary>('/progress/summary', {}, accessToken);
}
