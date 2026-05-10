import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const languageCodeEnum = pgEnum('language_code', ['en', 'es', 'sr']);
export const learningModeEnum = pgEnum('learning_mode', [
  'conversation',
  'scenario',
  'grammar',
  'vocabulary',
  'writing',
  'exam',
  'review',
]);
export const agentRoleEnum = pgEnum('agent_role', [
  'conversation_agent',
  'teacher_agent',
  'examiner_agent',
  'feedback_agent',
  'review_agent',
]);
export const correctionModeEnum = pgEnum('correction_mode', ['inline', 'delayed', 'critical_only']);
export const mistakeTypeEnum = pgEnum('mistake_type', [
  'grammar',
  'vocabulary',
  'tense',
  'preposition',
  'agreement',
  'word_order',
  'style',
]);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'completed']);
export const mistakeStatusEnum = pgEnum('mistake_status', ['open', 'resolved']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const feedbackStyleEnum = pgEnum('feedback_style', ['inline', 'delayed', 'critical_only']);
export const languageLevelEnum = pgEnum('language_level', ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    telegramId: text('telegram_id').notNull().unique(),
    username: text('username'),
    firstName: text('first_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('users_telegram_id_idx').on(t.telegramId)],
);

export const languageProfiles = pgTable(
  'language_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    language: languageCodeEnum('language').notNull(),
    nativeLanguage: text('native_language').default('ru').notNull(),
    currentLevel: languageLevelEnum('current_level'),
    preferredMode: learningModeEnum('preferred_mode'),
    feedbackStyle: feedbackStyleEnum('feedback_style').default('delayed').notNull(),
    goals: text('goals'),
  },
  (t) => [uniqueIndex('lp_user_lang_idx').on(t.userId, t.language)],
);

export const learningSessions = pgTable('learning_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  language: languageCodeEnum('language').notNull(),
  mode: learningModeEnum('mode'),
  agentRole: agentRoleEnum('agent_role'),
  correctionMode: correctionModeEnum('correction_mode'),
  scenarioHint: text('scenario_hint'),
  status: sessionStatusEnum('status').default('active').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const messageTurns = pgTable('message_turns', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => learningSessions.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  text: text('text').notNull(),
  correctedText: text('corrected_text'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mistakes = pgTable('mistakes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  language: languageCodeEnum('language').notNull(),
  type: mistakeTypeEnum('type').notNull(),
  sourceText: text('source_text').notNull(),
  correction: text('correction').notNull(),
  explanation: text('explanation'),
  severity: integer('severity').default(3).notNull(),
  status: mistakeStatusEnum('status').default('open').notNull(),
  nextReviewAt: timestamp('next_review_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type DbUser = typeof users.$inferSelect;
export type DbLanguageProfile = typeof languageProfiles.$inferSelect;
export type DbLearningSession = typeof learningSessions.$inferSelect;
export type DbMessageTurn = typeof messageTurns.$inferSelect;
export type DbMistake = typeof mistakes.$inferSelect;
