import { db } from '@/lib/db';
import { languageProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { LanguageCode } from '@/types';

export async function getOrCreateProfile(userId: string, language: LanguageCode) {
  const existing = await db.query.languageProfiles.findFirst({
    where: and(eq(languageProfiles.userId, userId), eq(languageProfiles.language, language)),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(languageProfiles)
    .values({ userId, language })
    .returning();
  return created;
}

export async function getProfile(userId: string, language: LanguageCode) {
  return db.query.languageProfiles.findFirst({
    where: and(eq(languageProfiles.userId, userId), eq(languageProfiles.language, language)),
  });
}

type ProfileUpdate = {
  nativeLanguage?: string;
  currentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  preferredMode?: 'conversation' | 'scenario' | 'grammar' | 'vocabulary' | 'writing' | 'exam' | 'review' | null;
  feedbackStyle?: 'inline' | 'delayed' | 'critical_only';
  goals?: string | null;
};

export async function updateProfile(userId: string, language: LanguageCode, data: ProfileUpdate) {
  const [updated] = await db
    .update(languageProfiles)
    .set(data)
    .where(and(eq(languageProfiles.userId, userId), eq(languageProfiles.language, language)))
    .returning();
  return updated;
}
