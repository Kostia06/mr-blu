import type { Env, AuthenticatedData } from '../../types';

interface SupabaseRow {
  [key: string]: unknown;
}

interface SendRequest {
  documentId: string;
  documentType: string;
  method: string;
  recipient: { email: string; name?: string };
  customMessage?: string;
  pdfBase64?: string;
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

  const body = (await request.json()) as SendRequest;

  if (!body.documentId || !body.recipient?.email) {
    return jsonResponse({ error: 'Missing documentId or recipient email' }, 400);
  }

  // Fetch the document
  const table = body.documentType === 'contract' ? 'contracts' : 'documents';
  const docResponse = await supabaseQuery(
    env,
    `${table}?id=eq.${body.documentId}&select=*,clients(id,name,email,phone,address)&limit=1`,
  );

  if (!docResponse.ok) {
    return jsonResponse({ error: 'Failed to fetch document' }, 500);
  }

  const docs = (await docResponse.json()) as SupabaseRow[];
  if (docs.length === 0) {
    return jsonResponse({ error: 'Document not found' }, 404);
  }

  const doc = docs[0];
  const client = doc.clients as SupabaseRow | null;
  const docType = (doc.document_type as string) || body.documentType || 'invoice';
  const docNumber = (doc.document_number as string) || '';

  // Fetch sender profile
  let senderProfile: SupabaseRow = {};
  const profileResponse = await supabaseQuery(
    env,
    `profiles?id=eq.${data.user.id}&select=full_name,business_name,email,phone,address,website&limit=1`,
  );
  if (profileResponse.ok) {
    const profiles = (await profileResponse.json()) as SupabaseRow[];
    if (profiles.length > 0) senderProfile = profiles[0];
  }

  // Generate share token
  const shareToken = crypto.randomUUID();
  const shareUrl = new URL(request.url).origin + `/view/${docType}/${body.documentId}?token=${shareToken}`;

  // Store in sent_documents
  const sentResponse = await supabaseQuery(env, 'sent_documents', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      document_id: body.documentId,
      document_type: docType,
      share_token: shareToken,
      delivery_method: body.method || 'email',
      user_id: data.user.id,
      recipient_email: body.recipient.email,
    }),
  });

  if (!sentResponse.ok) {
    console.error('Failed to create sent_documents record:', await sentResponse.text());
    return jsonResponse({ error: 'Failed to prepare document for sending' }, 500);
  }

  // Build and send email
  const senderName = (senderProfile.business_name as string)
    || (senderProfile.full_name as string)
    || 'Someone';
  const clientName = body.recipient.name
    || (client?.name as string)
    || 'there';

  const sender = {
    businessName: (senderProfile.business_name as string) || null,
    email: (senderProfile.email as string) || null,
    phone: (senderProfile.phone as string) || null,
    address: (senderProfile.address as string) || null,
    website: (senderProfile.website as string) || null,
  };

  const emailHtml = buildDocumentEmail({
    senderName,
    clientName,
    docType,
    docNumber,
    total: (doc.total as number) || 0,
    dueDate: (doc.due_date as string) ? formatDate(doc.due_date as string) : '',
    shareUrl,
    sender,
  });

  const docLabel = docType.charAt(0).toUpperCase() + docType.slice(1);
  const emailSubject = `${docLabel} ${docNumber} from ${senderName}`;

  const emailPayload: Record<string, unknown> = {
    from: `${senderName} via Mr.Blu <noreply@${env.EMAIL_FROM_DOMAIN}>`,
    to: body.recipient.email,
    subject: emailSubject,
    html: emailHtml,
  };

  if (body.pdfBase64) {
    const filename = `${docLabel}-${docNumber || body.documentId}.pdf`;
    emailPayload.attachments = [
      {
        filename,
        content: body.pdfBase64,
      },
    ];
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!emailResponse.ok) {
    const error = await emailResponse.text();
    console.error('Resend email failed:', error);
    return jsonResponse({ error: 'Failed to send email' }, 500);
  }

  const emailResult = (await emailResponse.json()) as { id?: string };

  // Update document status to 'sent'
  await supabaseQuery(
    env,
    `${table}?id=eq.${body.documentId}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'sent' }),
    },
  ).catch((err) => console.error('Failed to update document status:', err));

  // Send notification email to sender (fire-and-forget)
  if (data.user.email) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Mr.Blu <noreply@${env.EMAIL_FROM_DOMAIN}>`,
        to: data.user.email,
        subject: `${docLabel} sent to ${clientName}`,
        html: buildNotificationEmail({
          docType,
          docNumber,
          recipientName: clientName,
          recipientEmail: body.recipient.email,
          total: (doc.total as number) || 0,
          shareUrl,
        }),
      }),
    }).catch((err) => console.error('Failed to send notification:', err));
  }

  return jsonResponse({
    success: true,
    emailId: emailResult.id,
    shareUrl,
  });
};

// =============================================
// Email Templates
// =============================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface DocumentEmailData {
  senderName: string;
  clientName: string;
  docType: string;
  docNumber: string;
  total: number;
  dueDate: string;
  shareUrl: string;
  sender: {
    businessName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
  };
}

function buildDocumentEmail(data: DocumentEmailData): string {
  const typeLabel = capitalize(data.docType);
  const greeting = data.clientName ? `Hi ${data.clientName},` : 'Hi,';
  const article = data.docType === 'estimate' ? 'an' : 'a';
  const totalLine = `<p style="font-size:16px;margin:8px 0"><strong>Total: ${formatCurrency(data.total)}</strong></p>`;
  const dueLine = data.dueDate
    ? `<p style="margin:4px 0;color:#666">Due: ${data.dueDate}</p>`
    : '';

  const footerParts = [
    data.sender.businessName,
    data.sender.email,
    data.sender.phone,
    data.sender.address,
    data.sender.website,
  ]
    .filter(Boolean)
    .join(' | ');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
<tr><td style="background:#0066ff;padding:24px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">${typeLabel} ${data.docNumber}</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px">${greeting}</p>
<p style="margin:0 0 16px">${data.senderName} has sent you ${article} ${data.docType}.</p>
${totalLine}
${dueLine}
<div style="text-align:center;margin:28px 0">
<a href="${data.shareUrl}" style="display:inline-block;padding:14px 32px;background:#0066ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">View ${typeLabel}</a>
</div>
<p style="font-size:13px;color:#888;margin:24px 0 0">If the button doesn't work, copy this link:<br><a href="${data.shareUrl}" style="color:#0066ff;word-break:break-all">${data.shareUrl}</a></p>
</td></tr>
${footerParts ? `<tr><td style="padding:16px 32px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">${footerParts}</td></tr>` : ''}
</table>
</td></tr>
</table>
</body></html>`;
}

interface NotificationEmailData {
  docType: string;
  docNumber: string;
  recipientName: string;
  recipientEmail: string;
  total: number;
  shareUrl: string;
}

function buildNotificationEmail(data: NotificationEmailData): string {
  const typeLabel = capitalize(data.docType);
  const recipient = data.recipientName || data.recipientEmail;
  const totalLine = ` for ${formatCurrency(data.total)}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
<tr><td style="background:#10b981;padding:20px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">Sent Successfully</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 12px">Your ${typeLabel} <strong>${data.docNumber}</strong>${totalLine} was sent to <strong>${recipient}</strong>.</p>
<p style="font-size:13px;color:#888;margin:16px 0 0"><a href="${data.shareUrl}" style="color:#0066ff">View document</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
