import { NextRequest, NextResponse } from 'next/server';
import { getDueMistakes } from '@/lib/services/mistake.service';
import type { LanguageCode } from '@/types';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;
  const items = await getDueMistakes(userId, language);

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
