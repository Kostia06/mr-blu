import type { Env, AuthenticatedData } from '../../types';

interface ShareNotificationRequest {
  shareId: string;
  accountantEmail: string;
  accountantName?: string;
  shareUrl: string;
  expiresAt?: string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function supabaseQuery(
  env: Env,
  path: string,
  options?: RequestInit,
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({
  request,
  env,
  data,
}) => {
  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Email service not configured' }, 500);
  }

  const body = (await request.json()) as ShareNotificationRequest;

  if (!body.accountantEmail || !body.shareUrl) {
    return jsonResponse({ error: 'Missing accountant email or share URL' }, 400);
  }

  // Fetch sender profile
  const profileResponse = await supabaseQuery(
    env,
    `profiles?id=eq.${data.user.id}&select=full_name,business_name&limit=1`,
  );

  let senderName = 'Someone';
  if (profileResponse.ok) {
    const profiles = (await profileResponse.json()) as Array<Record<string, unknown>>;
    if (profiles.length > 0) {
      senderName = (profiles[0].business_name as string)
        || (profiles[0].full_name as string)
        || 'Someone';
    }
  }

  const recipientName = body.accountantName || 'there';
  const expiryLine = body.expiresAt
    ? `<p style="font-size:13px;color:#94a3b8;text-align:center">This link expires on ${formatDate(body.expiresAt)}.</p>`
    : '';

  const emailHtml = buildShareEmail({
    senderName,
    recipientName,
    shareUrl: body.shareUrl,
    expiryLine,
  });

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${senderName} via Mr.Blu <noreply@${env.EMAIL_FROM_DOMAIN}>`,
      to: body.accountantEmail,
      subject: `${senderName} shared invoices with you`,
      html: emailHtml,
    }),
  });

  if (!emailResponse.ok) {
    const error = await emailResponse.text();
    console.error('Resend email failed:', error);
    return jsonResponse({ error: 'Failed to send email' }, 500);
  }

  const result = (await emailResponse.json()) as { id?: string };
  return jsonResponse({ success: true, emailId: result.id });
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildShareEmail(data: {
  senderName: string;
  recipientName: string;
  shareUrl: string;
  expiryLine: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared Invoices - mrblu</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 32px;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #0066FF;
      letter-spacing: -0.5px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin: 0 0 12px;
      color: #0f172a;
    }
    p {
      margin: 0 0 16px;
      color: #64748b;
      text-align: center;
      font-size: 15px;
    }
    .button-container {
      text-align: center;
      margin: 24px 0;
    }
    .button {
      display: inline-block;
      background: #0066FF;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
    }
    .info-box {
      margin: 20px 0;
      padding: 14px;
      background: #f0f9ff;
      border-radius: 10px;
      border-left: none;
    }
    .info-box p {
      margin: 0;
      font-size: 13px;
      color: #475569;
      text-align: left;
    }
    .link-fallback {
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      word-break: break-all;
      margin-top: 24px;
    }
    .link-fallback a {
      color: #0066FF;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer p {
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">mrblu</span>
      </div>

      <h1>Shared Invoices</h1>
      <p>Hi ${escapeHtml(data.recipientName)}, <strong>${escapeHtml(data.senderName)}</strong> has shared their invoices with you for review.</p>

      <div class="button-container">
        <a href="${data.shareUrl}" class="button">View Invoices</a>
      </div>

      ${data.expiryLine}

      <div class="info-box">
        <p><strong>View &amp; Download only</strong> &mdash; You can view documents and download PDFs. No account needed.</p>
      </div>

      <div class="link-fallback">
        <p>Or copy this link: <a href="${data.shareUrl}">${data.shareUrl}</a></p>
      </div>
    </div>

    <div class="footer">
      <p>Sent via Mr.Blu</p>
    </div>
  </div>
</body>
</html>`;
}
