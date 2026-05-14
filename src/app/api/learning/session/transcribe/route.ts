import { NextRequest, NextResponse, after } from 'next/server';
import { db } from '@/lib/db';
import { audioLogs } from '@/lib/db/schema';
import { callAgent } from '@/lib/llm';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const audioField = formData.get('audio');
  if (!audioField || !(audioField instanceof Blob))
    return NextResponse.json({ error: 'Missing audio field' }, { status: 422 });

  if (audioField.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: 'Audio too large (max 10 MB)' }, { status: 413 });

  const language = request.headers.get('x-language') ?? 'en';
  const whisperUrl = process.env.WHISPER_URL ?? 'http://localhost:9000';

  const upstream = new FormData();
  upstream.append('audio_file', audioField, 'audio.webm');

  const t0 = Date.now();
  try {
    const res = await fetch(`${whisperUrl}/asr?task=transcribe&language=${language}&output=txt`, {
      method: 'POST',
      body: upstream,
    });
    const whisperMs = Date.now() - t0;

    if (!res.ok) throw new Error(`Whisper returned ${res.status}`);
    const text = (await res.text()).trim();

    if (!text)
      return NextResponse.json(
        {
          error:
            'Could not understand the voice message. Please check your microphone and try again.',
        },
        { status: 422 },
      );

    const corrected = await callAgent(
      "You are a transcription corrector. Fix any speech-to-text errors in the user's message. Keep the original language. Return only the corrected text, nothing else.",
      [{ role: 'user', content: text }],
    );

    console.log(
      JSON.stringify({
        event: 'transcribe',
        userId,
        language,
        audioBytes: audioField.size,
        whisperMs,
        empty: !text,
      }),
    );
    after(async () => {
      await db
        .insert(audioLogs)
        .values({ userId, language, audioBytes: audioField.size, whisperMs, empty: String(!text) });
    });

    return NextResponse.json({ text: corrected.trim() });
  } catch (err) {
    const whisperMs = Date.now() - t0;
    after(async () => {
      await db.insert(audioLogs).values({
        userId,
        language,
        audioBytes: audioField.size ?? 0,
        whisperMs,
        empty: 'false',
        error: String(err),
      });
    });
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
