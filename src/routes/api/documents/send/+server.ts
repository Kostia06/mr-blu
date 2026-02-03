import { json, type RequestHandler } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM_DOMAIN } from '$env/static/private';
import { logger } from '$lib/server/logger';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import {
	rateLimiters,
	rateLimitResponse,
	isValidEmail,
	isValidUUID,
	sanitizeString
} from '$lib/server/security';
import { generatePDFServer } from '$lib/templates/pdf-server';
import type { TemplateData } from '$lib/parsing/types';
import {
	formatCurrency as formatCurrencyBase,
	formatDate as formatDateBase
} from '$lib/utils/format';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Get the app URL from environment
const getAppUrl = () => {
	// Use EMAIL_FROM_DOMAIN if set (production)
	if (EMAIL_FROM_DOMAIN) {
		return `https://${EMAIL_FROM_DOMAIN}`;
	}
	// Default to localhost for development
	return 'http://localhost:5173';
};

// Email-specific formatting wrappers
const formatCurrency = (amount: number) => formatCurrencyBase(amount, true);
const formatDate = (dateStr: string | null) => formatDateBase(dateStr, 'long');

// Generate minimalist email HTML (spam-safe, prominent total)
const generateEmailHtml = (
	documentType: string,
	documentNumber: string,
	recipientName: string,
	viewUrl: string,
	senderName?: string,
	total?: number,
	dueDate?: string | null,
	senderDetails?: { email?: string | null; phone?: string | null; address?: string | null }
) => {
	const typeLabel = documentType === 'invoice' ? 'Invoice' : 'Estimate';
	const firstName = recipientName ? recipientName.split(' ')[0] : '';

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
<tr>
<td style="padding: 32px 16px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">

<!-- Simple header - who sent this document -->
<tr>
<td style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
<p style="margin: 0 0 8px; color: #1e293b; font-size: 18px; font-weight: 600;">
This is sent from your contractor<br>${senderName || ''}
</p>
<p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
${senderDetails?.email || ''}${senderDetails?.email && senderDetails?.phone ? ' • ' : ''}${senderDetails?.phone || ''}${senderDetails?.address ? `<br>${senderDetails.address}` : ''}
</p>
</td>
</tr>

<!-- Main content card -->
<tr>
<td style="background-color: #DBE8F4; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">

<!-- Total highlight box -->
${
	total !== undefined
		? `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
<tr>
<td style="background-color: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
<p style="margin: 0 0 4px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Total ${documentType === 'invoice' ? 'Due' : 'Amount'}</p>
<p style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 700;">${formatCurrency(total)}</p>
${dueDate ? `<p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">Due by ${formatDate(dueDate)}</p>` : ''}
</td>
</tr>
</table>
`
		: ''
}

<!-- CTA Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr>
<td style="text-align: center;">
<a href="${viewUrl}" target="_blank" style="display: inline-block; background-color: #0066FF; color: #DBE8F4; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
View ${typeLabel}
</a>
</td>
</tr>
</table>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding-top: 24px; text-align: center;">
<p style="margin: 0; color: #94a3b8; font-size: 12px;">Powered by mrblu</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
};

// Generate plain text version (for spam compliance)
const generatePlainText = (
	documentType: string,
	documentNumber: string,
	recipientName: string,
	viewUrl: string,
	senderName?: string,
	total?: number,
	dueDate?: string | null,
	senderDetails?: { email?: string | null; phone?: string | null; address?: string | null }
) => {
	const typeLabel = documentType === 'invoice' ? 'Invoice' : 'Estimate';
	const firstName = recipientName ? recipientName.split(' ')[0] : '';

	let text = `This is sent from your contractor ${senderName || ''}\n`;
	if (senderDetails?.email) text += `${senderDetails.email}`;
	if (senderDetails?.email && senderDetails?.phone) text += ` • `;
	if (senderDetails?.phone) text += `${senderDetails.phone}`;
	text += '\n';
	if (senderDetails?.address) text += `${senderDetails.address}\n`;
	text += '\n---\n\n';

	if (total !== undefined) {
		text += `Total ${documentType === 'invoice' ? 'Due' : 'Amount'}: ${formatCurrency(total)}\n`;
		if (dueDate) {
			text += `Due by: ${formatDate(dueDate)}\n`;
		}
		text += '\n';
	}

	text += `View your ${typeLabel.toLowerCase()}: ${viewUrl}\n\n`;
	text += `---\nPowered by mrblu`;

	return text;
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	// Check if Resend is configured
	if (!resend || !RESEND_API_KEY) {
		return json(
			{ error: 'Email service not configured. Please set RESEND_API_KEY in your environment.' },
			{ status: 500 }
		);
	}

	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;
	const rateLimit = rateLimiters.email(userId);
	if (!rateLimit.allowed) {
		return rateLimitResponse(rateLimit.resetIn);
	}

	const { documentId, documentType, method, recipient } = await request.json();

	if (!documentId || !documentType || !method || !recipient) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	// Validate document ID format
	if (!isValidUUID(documentId)) {
		return json({ error: 'Invalid document ID format' }, { status: 400 });
	}

	// Validate document type
	const validDocTypes = ['invoice', 'estimate', 'contract'];
	if (!validDocTypes.includes(documentType)) {
		return json({ error: 'Invalid document type' }, { status: 400 });
	}

	// Validate method
	const validMethods = ['email', 'sms'];
	if (!validMethods.includes(method)) {
		return json({ error: 'Invalid delivery method' }, { status: 400 });
	}

	const supabase = locals.supabase;

	try {
		if (method === 'email') {
			if (!recipient.email) {
				return json({ error: 'Email recipient is required' }, { status: 400 });
			}

			// Validate email format
			if (!isValidEmail(recipient.email)) {
				return json({ error: 'Invalid email address format' }, { status: 400 });
			}

			// Sanitize recipient name if provided
			const recipientName = recipient.name
				? sanitizeString(recipient.name, { maxLength: 100 })
				: '';

			const appUrl = getAppUrl();

			// Get sender info first (needed for subject and PDF)
			const { data: profile } = await supabase
				.from('profiles')
				.select('full_name, business_name, email, phone, address')
				.eq('id', session.user.id)
				.single();

			// Get name from profile, or fallback to session user metadata
			const userMeta = session.user.user_metadata;
			const userFullName =
				userMeta?.first_name && userMeta?.last_name
					? `${userMeta.first_name} ${userMeta.last_name}`
					: userMeta?.first_name || userMeta?.last_name || null;
			const senderName = profile?.full_name || userFullName || profile?.business_name || undefined;

			let documentNumber: string;
			let subject: string;
			let documentTotal: number | undefined;
			let documentDueDate: string | null = null;
			let pdfData: TemplateData | null = null;

			// Fetch document details (full data for PDF generation)
			if (documentType === 'invoice' || documentType === 'estimate') {
				// Both invoices and estimates are stored in the invoices table
				const { data, error } = await supabase
					.from('invoices')
					.select(
						`
						invoice_number, title, total, due_date, subtotal, tax_rate, tax_amount,
						line_items, created_at, notes,
						clients (name, email, phone, address)
					`
					)
					.eq('id', documentId)
					.single();

				if (error) throw new Error(`Failed to fetch ${documentType}: ${error.message}`);
				documentNumber = data?.invoice_number || data?.title || `#${documentId.slice(0, 8)}`;
				documentTotal = data?.total ? parseFloat(data.total) : undefined;
				documentDueDate = data?.due_date || null;
				const typeLabel = documentType === 'invoice' ? 'Invoice' : 'Estimate';
				subject = `${typeLabel} ${documentNumber} from ${senderName || 'mrblu'}`;

				// Prepare PDF data
				// Handle clients as array (Supabase returns array for foreign key relations)
				const clientData = Array.isArray(data?.clients) ? data.clients[0] : data?.clients;
				pdfData = {
					documentType: typeLabel.toUpperCase() as 'INVOICE' | 'ESTIMATE',
					documentNumber,
					billTo: {
						name: clientData?.name || recipientName || '',
						address: clientData?.address || null,
						city: null,
						phone: clientData?.phone || null,
						email: clientData?.email || recipient.email || null
					},
					from: {
						name: profile?.full_name || userFullName || null,
						businessName: profile?.business_name || '',
						address: profile?.address || null,
						city: null,
						phone: profile?.phone || userMeta?.phone || null,
						email: profile?.email || session.user.email || null
					},
					items: (data?.line_items || []).map((item: Record<string, unknown>, i: number) => ({
						id: `item-${i}`,
						description: String(item.description || ''),
						quantity: Number(item.quantity) || undefined,
						unit: String(item.unit || ''),
						rate: Number(item.rate) || undefined,
						total: Number(item.total) || 0,
						dimensions: item.dimensions
							? {
									width: (item.dimensions as Record<string, unknown>).width as number | null,
									length: (item.dimensions as Record<string, unknown>).length as number | null,
									unit: (item.dimensions as Record<string, unknown>).unit as string | null
								}
							: null
					})),
					subtotal: Number(data?.subtotal) || 0,
					gstRate: Number(data?.tax_rate) / 100 || 0,
					gstAmount: Number(data?.tax_amount) || 0,
					total: Number(data?.total) || 0,
					date: data?.created_at ? new Date(data.created_at).toISOString().split('T')[0] : '',
					dueDate: data?.due_date || null,
					notes: data?.notes || null
				};
			} else if (documentType === 'contract') {
				const { data, error } = await supabase
					.from('contracts')
					.select('title')
					.eq('id', documentId)
					.single();

				if (error) throw new Error(`Failed to fetch contract: ${error.message}`);
				documentNumber = data?.title || `#${documentId.slice(0, 8)}`;
				subject = `Contract ${documentNumber} from ${senderName || 'mrblu'}`;
				// Contracts don't use PDF attachment for now
			} else {
				return json({ error: 'Invalid document type' }, { status: 400 });
			}

			// Generate share token for the view URL (using Web Crypto API for Cloudflare Workers)
			const randomArray = crypto.getRandomValues(new Uint8Array(32));
			const shareToken = btoa(String.fromCharCode(...randomArray))
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=+$/g, '');

			// Store share record
			await supabase.from('sent_documents').insert({
				user_id: userId,
				document_id: documentId,
				document_type: documentType,
				delivery_method: 'email',
				recipient_email: recipient.email,
				share_token: shareToken
			});

			const viewUrl = `${appUrl}/view/${documentType}/${documentId}?token=${shareToken}`;

			// Prepare sender details for email
			const senderDetails = {
				email: profile?.email || null,
				phone: profile?.phone || null,
				address: profile?.address || null
			};

			// Generate email HTML and plain text
			const emailHtml = generateEmailHtml(
				documentType,
				documentNumber,
				recipientName,
				viewUrl,
				senderName,
				documentTotal,
				documentDueDate,
				senderDetails
			);

			const emailText = generatePlainText(
				documentType,
				documentNumber,
				recipientName,
				viewUrl,
				senderName,
				documentTotal,
				documentDueDate,
				senderDetails
			);

			// Determine from address
			const fromDomain = EMAIL_FROM_DOMAIN || 'mrblu.com';
			const fromAddress = `mrblu <noreply@${fromDomain}>`;

			// Generate PDF attachment if we have the data
			let attachments: Array<{ filename: string; content: string }> | undefined;
			if (pdfData) {
				try {
					console.log('Generating PDF for:', documentNumber);
					const pdfBuffer = await generatePDFServer(pdfData, platform!.env.MYBROWSER);
					console.log('PDF generated, size:', pdfBuffer.byteLength);
					const typeLabel = documentType === 'invoice' ? 'Invoice' : 'Estimate';
					// Convert ArrayBuffer to base64 for Resend (Cloudflare Workers compatible)
					const uint8Array = new Uint8Array(pdfBuffer);
					let binary = '';
					const chunkSize = 8192;
					for (let i = 0; i < uint8Array.length; i += chunkSize) {
						const chunk = uint8Array.subarray(i, i + chunkSize);
						binary += String.fromCharCode.apply(null, Array.from(chunk));
					}
					const base64Content = btoa(binary);
					console.log('PDF base64 length:', base64Content.length);
					attachments = [
						{
							filename: `${typeLabel}-${documentNumber}.pdf`,
							content: base64Content
						}
					];
				} catch (pdfError) {
					console.error('Failed to generate PDF attachment:', pdfError);
					// Continue without attachment - email can still be sent
				}
			}

			// Send email via Resend
			const { data, error } = await resend.emails.send({
				from: fromAddress,
				to: [recipient.email],
				subject: subject,
				html: emailHtml,
				text: emailText,
				attachments
			});

			if (error) {
				console.error('Resend error:', error);
				return json(
					{ success: false, error: 'Failed to send email. Please try again.' },
					{ status: 500 }
				);
			}

			// Update document status to 'sent'
			// Both invoices and estimates are in the 'invoices' table; only contracts use 'contracts'
			const tableName = documentType === 'contract' ? 'contracts' : 'invoices';
			const { error: updateError } = await supabase
				.from(tableName)
				.update({ status: 'sent' })
				.eq('id', documentId);

			if (updateError) {
				console.error('Failed to update document status:', updateError);
				// Don't fail the request - email was sent successfully
			}

			const typeLabels: Record<string, string> = {
				invoice: 'Invoice',
				estimate: 'Estimate',
				contract: 'Contract'
			};
			const typeLabel = typeLabels[documentType] || 'Document';

			// Send notification email to user if enabled
			try {
				const { data: userData } = await supabase.auth.getUser();
				const notificationPrefs = userData?.user?.user_metadata?.notification_preferences;
				const shouldNotify =
					documentType === 'invoice'
						? notificationPrefs?.emailOnInvoiceSent !== false
						: documentType === 'estimate'
							? notificationPrefs?.emailOnEstimateSent !== false
							: false;

				if (shouldNotify && userData?.user?.email) {
					// Use same format as sent email but with "Sent successfully to..." header
					const userNotificationHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
<tr>
<td style="padding: 32px 16px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">

<!-- Success header -->
<tr>
<td style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
<p style="margin: 0 0 8px; color: #22c55e; font-size: 18px; font-weight: 600;">
Sent successfully to ${recipient.email}
</p>
<p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
${typeLabel} ${documentNumber}${documentTotal ? ` • ${formatCurrency(documentTotal)}` : ''}
</p>
</td>
</tr>

<!-- Main content card -->
<tr>
<td style="background-color: #DBE8F4; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">

<p style="margin: 0 0 16px; color: #1e293b; font-size: 16px;">
Your ${typeLabel.toLowerCase()} has been delivered.
</p>

<p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.5;">
${recipientName ? `${recipientName} can` : 'The recipient can'} view and download the document using the link in the email.
</p>

<!-- View link -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
<tr>
<td style="text-align: center;">
<a href="${viewUrl}" target="_blank" style="display: inline-block; background-color: #0066FF; color: #DBE8F4; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
View ${typeLabel}
</a>
</td>
</tr>
</table>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding-top: 24px; text-align: center;">
<p style="margin: 0; color: #94a3b8; font-size: 12px;">Powered by mrblu</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

					await resend.emails.send({
						from: fromAddress,
						to: [userData.user.email],
						subject: `${typeLabels[documentType]} ${documentNumber} sent to ${recipient.email}`,
						html: userNotificationHtml
					});
				}
			} catch (notifyError) {
				// Don't fail the request - notification is not critical
				console.error('Failed to send notification email:', notifyError);
			}

			return json({
				success: true,
				message: `${typeLabels[documentType] || 'Document'} sent successfully`,
				emailId: data?.id
			});
		} else if (method === 'sms') {
			// TODO: Implement SMS sending via Twilio
			return json({ error: 'SMS sending is not yet available' }, { status: 501 });
		}

		return json({ error: 'Unsupported delivery method' }, { status: 400 });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('document_send', err.message, {
			stack: err.stack,
			user_id: locals.session?.user?.id,
			request_path: '/api/documents/send',
			request_method: 'POST'
		});
		return json({ success: false, error: err.message || 'An unknown error occurred' }, { status: 500 });
	}
};
