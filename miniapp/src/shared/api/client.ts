import { getActiveLearningLanguage } from '@/shared/language/runtime';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
  accessToken: string | null = null,
): Promise<TResponse> {
  const learningLanguage = getActiveLearningLanguage();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'X-Language': learningLanguage,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new ApiError(payload.detail || 'Request failed.', response.status);
  }

  return response.json() as Promise<TResponse>;
}
