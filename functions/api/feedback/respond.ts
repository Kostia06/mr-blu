import type { Env, AuthenticatedData } from '../../types';

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({
  request,
  env,
  data,
}) => {
  const body = (await request.json()) as {
    id?: string;
    response?: string;
  };

  if (!body.id || !body.response?.trim()) {
    return new Response(
      JSON.stringify({ error: 'Missing feedback id or response' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Update the feedback record
  const updateResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/admin_comments?id=eq.${body.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        admin_response: body.response.trim(),
        responded_by: data.user.id,
        responded_at: new Date().toISOString(),
      }),
    },
  );

  if (!updateResponse.ok) {
    console.error('Feedback update failed:', await updateResponse.text());
    return new Response(
      JSON.stringify({ error: 'Failed to update feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fetch the feedback with user info to send notification email
  const feedbackResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/admin_comments?id=eq.${body.id}&select=*,profiles(email,full_name)`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  );

  if (feedbackResponse.ok && env.RESEND_API_KEY) {
    const [feedback] = (await feedbackResponse.json()) as Array<{
      comment: string;
      profiles?: { email?: string; full_name?: string };
    }>;

    const recipientEmail = feedback?.profiles?.email;
    if (recipientEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Mr.Blu <noreply@${env.EMAIL_FROM_DOMAIN}>`,
          to: recipientEmail,
          subject: 'Response to your feedback — Mr.Blu',
          html: buildFeedbackResponseEmail(
            feedback.profiles?.full_name || 'there',
            feedback.comment,
            body.response!.trim(),
          ),
        }),
      }).catch((err) => console.error('Failed to send feedback email:', err));
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};

function buildFeedbackResponseEmail(
  name: string,
  originalComment: string,
  response: string,
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <h2 style="color: #0066ff; font-size: 20px; margin: 0 0 24px;">Mr.Blu</h2>
      <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Hi ${name},</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">We've responded to your feedback:</p>
      <div style="background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; margin: 0 0 16px; border-radius: 0 6px 6px 0;">
        <p style="color: #64748b; font-size: 13px; margin: 0; font-style: italic;">"${originalComment}"</p>
      </div>
      <div style="background: #eff6ff; border-left: 3px solid #0066ff; padding: 12px 16px; margin: 0 0 24px; border-radius: 0 6px 6px 0;">
        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">${response}</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">— The Mr.Blu Team</p>
    </div>
  `;
}
