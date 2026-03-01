import type { Env, AuthenticatedData } from '../../types';

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({ request, env }) => {
  const apiKey = env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Deepgram not configured' }, { status: 500 });
  }

  const contentType = request.headers.get('Content-Type') || 'audio/webm';
  const audioBuffer = await request.arrayBuffer();

  if (audioBuffer.byteLength === 0) {
    return Response.json({ error: 'No audio data' }, { status: 400 });
  }

  const response = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=multi&smart_format=true&punctuate=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': contentType,
      },
      body: audioBuffer,
    },
  );

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    return Response.json({ error: 'Transcription failed', details: err }, { status: 500 });
  }

  const result = (await response.json()) as {
    results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
  };
  const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

  return Response.json({ transcript });
};
