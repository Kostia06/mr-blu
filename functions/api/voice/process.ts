interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const { transcript } = await request.json();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Extract invoice data from: "${transcript}"` }] }],
      }),
    }
  );

  const result = await response.json();
  return Response.json(result);
}
