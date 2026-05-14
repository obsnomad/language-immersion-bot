import { NextRequest, NextResponse } from 'next/server';

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
  console.log('language set is', language);
  const whisperUrl = process.env.WHISPER_URL ?? 'http://localhost:9000';

  const upstream = new FormData();
  upstream.append('audio_file', audioField, 'audio.webm');

  try {
    const res = await fetch(`${whisperUrl}/asr?task=transcribe&language=${language}&output=txt`, {
      method: 'POST',
      body: upstream,
    });
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
    return NextResponse.json({ text });
  } catch (err) {
    console.error('Whisper error', err);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
