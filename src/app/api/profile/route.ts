import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfile, updateProfile } from '@/lib/services/profile.service';
import type { LanguageCode } from '@/types';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  nativeLanguage: z.string().min(1).optional(),
  currentLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).nullable().optional(),
  preferredMode: z
    .enum(['conversation', 'scenario', 'grammar', 'vocabulary', 'writing', 'exam', 'review'])
    .nullable()
    .optional(),
  feedbackStyle: z.enum(['inline', 'delayed', 'critical_only']).optional(),
  goals: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;
  const profile = await getOrCreateProfile(userId, language);
  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;

  const body = await request.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 422 });
  }

  const profile = await updateProfile(userId, language, parsed.data);
  return NextResponse.json(profile);
}
