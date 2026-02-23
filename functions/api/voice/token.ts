import type { Env, AuthenticatedData } from '../../types';

export const onRequestGet: PagesFunction<Env, string, AuthenticatedData> = async ({ env }) => {
  const apiKey = env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ apiKey: null, error: 'API key not configured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ apiKey }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
