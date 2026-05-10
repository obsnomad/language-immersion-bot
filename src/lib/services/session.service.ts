import { db } from '@/lib/db';
import { learningSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { LanguageCode, LearningMode, AgentRole, CorrectionMode } from '@/types';

export async function getActiveSession(userId: string, language: LanguageCode) {
  return db.query.learningSessions.findFirst({
    where: and(
      eq(learningSessions.userId, userId),
      eq(learningSessions.language, language),
      eq(learningSessions.status, 'active'),
    ),
  });
}

export async function upsertSession(
  userId: string,
  language: LanguageCode,
  opts: {
    mode: LearningMode;
    agentRole: AgentRole;
    correctionMode: CorrectionMode;
    scenarioHint: string | null;
  },
) {
  const existing = await getActiveSession(userId, language);

  if (existing) {
    const [updated] = await db
      .update(learningSessions)
      .set(opts)
      .where(eq(learningSessions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(learningSessions)
    .values({ userId, language, ...opts })
    .returning();
  return created;
}

export async function countSessions(userId: string): Promise<number> {
  const rows = await db.query.learningSessions.findMany({
    where: eq(learningSessions.userId, userId),
    columns: { id: true },
  });
  return rows.length;
}

export async function getRecentSessions(userId: string, limit = 5) {
  return db.query.learningSessions.findMany({
    where: eq(learningSessions.userId, userId),
    orderBy: [desc(learningSessions.startedAt)],
    limit,
    columns: { id: true, mode: true, language: true, startedAt: true },
  });
}
