export type LanguageCode = 'en' | 'es' | 'sr';
export type LearningMode = 'conversation' | 'scenario' | 'grammar' | 'vocabulary' | 'writing' | 'exam' | 'review';
export type AgentRole = 'conversation_agent' | 'teacher_agent' | 'examiner_agent' | 'feedback_agent' | 'review_agent';
export type CorrectionMode = 'inline' | 'delayed' | 'critical_only';
export type MistakeType = 'grammar' | 'vocabulary' | 'tense' | 'preposition' | 'agreement' | 'word_order' | 'style';
export type SessionStatus = 'active' | 'completed';
export type FeedbackStyle = 'inline' | 'delayed' | 'critical_only';
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type MessageRole = 'user' | 'assistant';
export type MistakeStatus = 'open' | 'resolved';

export interface User {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  createdAt: Date;
}

export interface LanguageProfile {
  id: string;
  userId: string;
  language: LanguageCode;
  nativeLanguage: string;
  currentLevel: LanguageLevel | null;
  preferredMode: LearningMode | null;
  feedbackStyle: FeedbackStyle;
  goals: string | null;
}

export interface LearningSession {
  id: string;
  userId: string;
  language: LanguageCode;
  mode: LearningMode | null;
  agentRole: AgentRole | null;
  correctionMode: CorrectionMode | null;
  scenarioHint: string | null;
  status: SessionStatus;
  startedAt: Date;
  endedAt: Date | null;
}

export interface MessageTurn {
  id: string;
  sessionId: string;
  role: MessageRole;
  text: string;
  correctedText: string | null;
  createdAt: Date;
}

export interface Mistake {
  id: string;
  userId: string;
  language: LanguageCode;
  type: MistakeType;
  sourceText: string;
  correction: string;
  explanation: string | null;
  severity: number;
  status: MistakeStatus;
  nextReviewAt: Date | null;
  createdAt: Date;
}

export interface MistakeRecord {
  type: MistakeType;
  sourceText: string;
  correction: string;
  explanation: string | null;
  severity: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  profile: LanguageProfile;
}

export interface PracticeMessageResponse {
  reply: string;
  feedback: string | null;
  mistakes: MistakeRecord[];
}

export interface PracticeHistoryMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface PracticeHistoryResponse {
  session: {
    id: string;
    mode: LearningMode | null;
    language: LanguageCode;
    scenarioHint: string | null;
    startedAt: Date;
  } | null;
  messages: PracticeHistoryMessage[];
}

export interface ReviewItem {
  id: string;
  type: MistakeType;
  sourceText: string;
  correction: string;
  explanation: string | null;
  severity: number;
  createdAt: Date;
}

export interface ProgressSummary {
  sessionCount: number;
  openMistakes: number;
  reviewDue: number;
  recentSessions: Array<{
    id: string;
    mode: LearningMode | null;
    language: LanguageCode;
    startedAt: Date;
  }>;
}

export interface TokenPayload {
  sub: string;
  telegramId: string;
  iat: number;
  exp: number;
}
