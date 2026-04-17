import { apiRequest } from '../client';
import type { AuthResponse, Profile, User } from '../types';

export function authenticateTelegramMiniApp(initData: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/telegram-mini-app', {
    method: 'POST',
    headers: {
      Authorization: `tma ${initData}`,
    },
  });
}

export function fetchCurrentUser(accessToken: string): Promise<User> {
  return apiRequest<User>('/me', {}, accessToken);
}

export function fetchProfile(accessToken: string): Promise<Profile> {
  return apiRequest<Profile>('/profile', {}, accessToken);
}
