import { NextRequest, NextResponse } from 'next/server';
import { countSessions, getRecentSessions } from '@/lib/services/session.service';
import { countOpenMistakes, countReviewDue } from '@/lib/services/mistake.service';
import { db } from '@/lib/db';
import { mistakes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { LanguageCode } from '@/types';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;

  const [sessionCount, openMistakes, reviewDue, recentSessions, mistakeRows] = await Promise.all([
    countSessions(userId),
    countOpenMistakes(userId, language),
    countReviewDue(userId, language),
    getRecentSessions(userId, 5),
    db
      .select({ type: mistakes.type })
      .from(mistakes)
      .where(
        and(
          eq(mistakes.userId, userId),
          eq(mistakes.language, language),
          eq(mistakes.status, 'open'),
        ),
      ),
  ]);

  const counts = mistakeRows.reduce<Record<string, number>>((acc, { type }) => {
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const grammarMistakes =
    (counts.grammar ?? 0) +
    (counts.tense ?? 0) +
    (counts.agreement ?? 0) +
    (counts.preposition ?? 0) +
    (counts.word_order ?? 0);

  const vocabMistakes = (counts.vocabulary ?? 0) + (counts.style ?? 0);

  const grammar = Math.max(0, Math.min(100, 100 - grammarMistakes * 8));
  const vocabulary = Math.max(0, Math.min(100, 100 - vocabMistakes * 8));
  const fluency = Math.min(100, sessionCount * 5);
  const confidence = Math.round((grammar + vocabulary + fluency) / 3);

  return NextResponse.json({
    sessionCount,
    openMistakes,
    reviewDue,
    recentSessions,
    skills: { grammar, vocabulary, fluency, confidence },
  });
}
