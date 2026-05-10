import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserByTelegramId(telegramId: string) {
  return db.query.users.findFirst({ where: eq(users.telegramId, telegramId) });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getOrCreateUser(
  telegramId: string,
  username?: string | null,
  firstName?: string | null,
) {
  const existing = await getUserByTelegramId(telegramId);

  if (existing) {
    if (existing.username !== (username ?? null) || existing.firstName !== (firstName ?? null)) {
      const [updated] = await db
        .update(users)
        .set({ username: username ?? null, firstName: firstName ?? null })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({ telegramId, username: username ?? null, firstName: firstName ?? null })
    .returning();
  return created;
}
