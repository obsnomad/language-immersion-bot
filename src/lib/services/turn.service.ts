import { db } from '@/lib/db';
import { messageTurns } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import type { MessageRole } from '@/types';

export async function saveTurn(
  sessionId: string,
  role: MessageRole,
  text: string,
  correctedText?: string | null,
) {
  const [turn] = await db
    .insert(messageTurns)
    .values({ sessionId, role, text, correctedText: correctedText ?? null })
    .returning();
  return turn;
}

export async function getRecentTurns(sessionId: string, limit = 8) {
  const turns = await db.query.messageTurns.findMany({
    where: eq(messageTurns.sessionId, sessionId),
    orderBy: [asc(messageTurns.createdAt)],
  });
  return turns.slice(-limit).map((t) => ({
    role: t.role as 'user' | 'assistant',
    content: t.text,
  }));
}

export async function getSessionTurns(sessionId: string) {
  return db.query.messageTurns.findMany({
    where: eq(messageTurns.sessionId, sessionId),
    orderBy: [asc(messageTurns.createdAt)],
    columns: {
      id: true,
      role: true,
      text: true,
      createdAt: true,
    },
  });
}
