interface Env {
  RESEND_API_KEY: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const { to, subject, html } = await request.json();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Mr. Blu <noreply@mrblu.com>',
      to,
      subject,
      html,
    }),
  });

  const result = await response.json();
  return Response.json(result);
}
