export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name?: string | null;
  created_at: string;
}

export interface Profile {
  native_language: string;
  target_languages: string[];
  current_level: string | null;
  preferred_mode: string | null;
  feedback_style: string;
  goals: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: User;
  profile: Profile;
}

export interface StoredSession {
  accessToken: string;
  expiresAt: string;
}

export interface PracticeMessageResponse {
  reply_text: string;
  session_id: number;
  language: string;
  mode: string;
  agent: string;
  correction_mode: string;
  feedback_summary: string | null;
  mistakes_detected: number;
}

export interface RecentSession {
  id: number;
  language: string;
  mode: string;
  started_at: string;
  status: string;
}

export interface ProgressSummary {
  sessions_total: number;
  open_mistakes: number;
  review_due_now: number;
  recent_sessions: RecentSession[];
}

export interface ReviewItem {
  id: number;
  language: string;
  category: string;
  source_text: string;
  correction: string;
  explanation: string;
  severity: number;
  next_review_at: string | null;
}

export interface ReviewListResponse {
  items: ReviewItem[];
}

export type StatusTone = 'neutral' | 'warning' | 'danger' | 'success';
