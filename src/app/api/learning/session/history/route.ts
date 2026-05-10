import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/services/session.service';
import { getSessionTurns } from '@/lib/services/turn.service';
import type { LanguageCode } from '@/types';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;
  const session = await getActiveSession(userId, language);

  if (!session) {
    return NextResponse.json({ session: null, messages: [] });
  }

  const turns = await getSessionTurns(session.id);

  return NextResponse.json({
    session: {
      id: session.id,
      mode: session.mode,
      language: session.language,
      scenarioHint: session.scenarioHint,
      startedAt: session.startedAt,
    },
    messages: turns.map((turn) => ({
      id: turn.id,
      role: turn.role,
      content: stripPracticeMetadata(turn.text),
      createdAt: turn.createdAt,
    })),
  });
}

function stripPracticeMetadata(text: string): string {
  return text
    .replace(/^(Roleplay scenario:|Interview practice:)\s*/i, '')
    .replace(/^Scenario:\s*.+\n/i, '')
    .replace(/^Mode:\s*.+\n/i, '')
    .trim();
}
