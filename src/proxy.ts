import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

const PUBLIC_PATHS = [
  '/api/auth/',
  '/api/bot/',
  '/api/health',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await verifyToken(authHeader.slice(7));
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.sub as string);
    headers.set('x-telegram-id', payload.telegramId);
    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
