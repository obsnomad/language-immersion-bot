import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mistakes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { LanguageCode } from '@/types';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;

  const items = await db.query.mistakes.findMany({
    where: and(
      eq(mistakes.userId, userId),
      eq(mistakes.language, language),
      eq(mistakes.status, 'open'),
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json(
    items.map((m) => ({
      id: m.id,
      type: m.type,
      sourceText: m.sourceText,
      correction: m.correction,
      explanation: m.explanation,
      severity: m.severity,
      createdAt: m.createdAt,
    })),
  );
}
