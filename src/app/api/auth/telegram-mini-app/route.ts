import { NextRequest, NextResponse } from 'next/server';
import { validateTMAInitData } from '@/lib/auth/tma';
import { signToken } from '@/lib/auth/session';
import { getOrCreateUser } from '@/lib/services/user.service';
import { getOrCreateProfile } from '@/lib/services/profile.service';
import type { LanguageCode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const initData = authHeader.startsWith('tma ') ? authHeader.slice(4) : authHeader;

    if (!initData) {
      return NextResponse.json({ error: 'Missing Telegram init data' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

    const maxAge = parseInt(process.env.TMA_AUTH_MAX_AGE ?? '3600', 10);
    const tgUser = await validateTMAInitData(initData, botToken, maxAge);

    const user = await getOrCreateUser(String(tgUser.id), tgUser.username, tgUser.first_name);

    const language = (request.headers.get('x-language') ?? 'en') as LanguageCode;
    const profile = await getOrCreateProfile(user.id, language);
    const token = await signToken(user.id, String(tgUser.id));

    return NextResponse.json({ token, user, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    console.error('telegram mini app auth failed', message);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
