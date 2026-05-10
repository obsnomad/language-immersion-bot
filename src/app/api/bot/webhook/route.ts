import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { bot } from '@/lib/bot';

const handler = webhookCallback(bot, 'std/http');

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handler(request) as Promise<NextResponse>;
}
