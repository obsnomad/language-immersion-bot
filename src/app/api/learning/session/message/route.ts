import { NextRequest, NextResponse } from 'next/server';
import { handleMessage } from '@/lib/services/practice.service';
import type { LanguageCode } from '@/types';
import { z } from 'zod';

const Schema = z.object({ message: z.string().min(1).max(2000) });

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 422 });
  }

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;

  try {
    const result = await handleMessage(userId, language, parsed.data.message);
    return NextResponse.json(result);
  } catch (err) {
    console.error('practice error', err);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}
