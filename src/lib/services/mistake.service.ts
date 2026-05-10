import { db } from '@/lib/db';
import { mistakes } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import type { LanguageCode, MistakeRecord } from '@/types';

const NEXT_REVIEW_DAYS = [1, 3, 7, 14, 30];

export async function saveMistakes(
  userId: string,
  language: LanguageCode,
  records: MistakeRecord[],
) {
  if (records.length === 0) return;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 1);

  await db.insert(mistakes).values(
    records.map((r) => ({
      userId,
      language,
      type: r.type,
      sourceText: r.sourceText,
      correction: r.correction,
      explanation: r.explanation ?? null,
      severity: r.severity,
      nextReviewAt: nextReview,
    })),
  );
}

export async function getDueMistakes(userId: string, language: LanguageCode) {
  return db.query.mistakes.findMany({
    where: and(
      eq(mistakes.userId, userId),
      eq(mistakes.language, language),
      eq(mistakes.status, 'open'),
      lte(mistakes.nextReviewAt, new Date()),
    ),
  });
}

export async function countOpenMistakes(userId: string, language: LanguageCode) {
  const rows = await db.query.mistakes.findMany({
    where: and(
      eq(mistakes.userId, userId),
      eq(mistakes.language, language),
      eq(mistakes.status, 'open'),
    ),
    columns: { id: true },
  });
  return rows.length;
}

export async function countReviewDue(userId: string, language: LanguageCode) {
  const rows = await getDueMistakes(userId, language);
  return rows.length;
}
