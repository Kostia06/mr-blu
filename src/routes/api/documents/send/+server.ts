import { json, type RequestHandler } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM_DOMAIN } from '$env/static/private';
import { logger } from '$lib/server/logger';
import {
	rateLimiters,
	rateLimitResponse,
	isValidEmail,
	isValidUUID,
	sanitizeString
} from '$lib/server/security';
import { generatePDFServer } from '$lib/templates/pdf-server';
import type { TemplateData } from '$lib/parsing/types';
import { generateDocumentEmail, generateNotificationEmail } from '$lib/server/email-templates';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Get the app URL from environment
const getAppUrl = () => {
	if (EMAIL_FROM_DOMAIN) {
		return `https://${EMAIL_FROM_DOMAIN}`;
	}
	return 'http://localhost:5173';
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
				.select('full_name, business_name, email, phone, address, business_address, website')
				.eq('id', session.user.id)
				.single();

			// Get name from profile, or fallback to session user metadata
			const userMeta = session.user.user_metadata;
			const userFullName =
				userMeta?.first_name && userMeta?.last_name
					? `${userMeta.first_name} ${userMeta.last_name}`
					: userMeta?.first_name || userMeta?.last_name || null;
			const senderName = profile?.full_name || userFullName || profile?.business_name || undefined;

			// Build full address from profile + user metadata
			const biz = userMeta?.business;
			const fullAddress = [
				profile?.business_address || profile?.address || biz?.address,
				[biz?.city, biz?.state, biz?.zip].filter(Boolean).join(', ')
			]
				.filter(Boolean)
				.join('\n');

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
						address: fullAddress || null,
						city: null,
						phone: profile?.phone || userMeta?.phone || null,
						email: profile?.email || session.user.email || null,
						website: profile?.website || biz?.website || null
					},
					items: (data?.line_items || []).map((item: Record<string, unknown>, i: number) => {
						let dims: string | undefined;
						if (typeof item.dimensions === 'string') {
							dims = item.dimensions;
						} else if (item.dimensions && typeof item.dimensions === 'object') {
							const d = item.dimensions as Record<string, unknown>;
							if (d.width && d.length) {
								dims = `${d.width} × ${d.length} ${d.unit || 'ft'}`;
							}
						}
						return {
							id: `item-${i}`,
							description: String(item.description || ''),
							quantity: Number(item.quantity) || undefined,
							unit: String(item.unit || ''),
							rate: Number(item.rate) || undefined,
							total: Number(item.total) || 0,
							measurementType: (item.measurementType as string) || undefined,
							dimensions: dims
						};
					}),
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

			// Generate email HTML and plain text
			const { html: emailHtml, text: emailText } = generateDocumentEmail({
				documentType,
				documentNumber,
				recipientName,
				viewUrl,
				senderName,
				total: documentTotal,
				dueDate: documentDueDate,
				sender: {
					businessName: profile?.business_name || null,
					email: profile?.email || null,
					phone: profile?.phone || null,
					address: fullAddress || null,
					website: biz?.website || null
				}
			});

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
				const shouldNotify = notificationPrefs?.emailConfirmation !== false;

				if (shouldNotify && userData?.user?.email) {
					const { html: notifHtml, text: notifText } = generateNotificationEmail({
						documentType,
						documentNumber,
						recipientEmail: recipient.email,
						recipientName,
						viewUrl,
						total: documentTotal
					});

					await resend.emails.send({
						from: fromAddress,
						to: [userData.user.email],
						subject: `${typeLabels[documentType]} ${documentNumber} sent to ${recipient.email}`,
						html: notifHtml,
						text: notifText
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
