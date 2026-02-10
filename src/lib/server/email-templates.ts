interface DocumentEmailParams {
	documentType: string;
	documentNumber: string;
	recipientName: string;
	viewUrl: string;
	senderName?: string;
	total?: number;
	dueDate?: string | null;
	sender: {
		businessName: string | null;
		email: string | null;
		phone: string | null;
		address: string | null;
		website: string | null;
	};
}

interface NotificationEmailParams {
	documentType: string;
	documentNumber: string;
	recipientEmail: string;
	recipientName: string;
	viewUrl: string;
	total?: number;
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateDocumentEmail(params: DocumentEmailParams): { html: string; text: string } {
	const {
		documentType,
		documentNumber,
		recipientName,
		viewUrl,
		senderName,
		total,
		dueDate,
		sender
	} = params;

	const typeLabel = capitalize(documentType);
	const greeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
	const from = senderName || sender.businessName || 'mrblu';
	const totalLine = total != null ? `<p style="font-size:16px;margin:8px 0"><strong>Total: ${formatCurrency(total)}</strong></p>` : '';
	const dueLine = dueDate ? `<p style="margin:4px 0;color:#666">Due: ${dueDate}</p>` : '';
	const totalText = total != null ? `Total: ${formatCurrency(total)}\n` : '';
	const dueText = dueDate ? `Due: ${dueDate}\n` : '';

	const footerParts = [sender.businessName, sender.email, sender.phone, sender.address, sender.website]
		.filter(Boolean)
		.join(' | ');

	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
<tr><td style="background:#0066ff;padding:24px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">${typeLabel} ${documentNumber}</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px">${greeting}</p>
<p style="margin:0 0 16px">${from} has sent you ${documentType === 'estimate' ? 'an' : 'a'} ${documentType}.</p>
${totalLine}
${dueLine}
<div style="text-align:center;margin:28px 0">
<a href="${viewUrl}" style="display:inline-block;padding:14px 32px;background:#0066ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">View ${typeLabel}</a>
</div>
<p style="font-size:13px;color:#888;margin:24px 0 0">If the button doesn't work, copy this link:<br><a href="${viewUrl}" style="color:#0066ff;word-break:break-all">${viewUrl}</a></p>
</td></tr>
${footerParts ? `<tr><td style="padding:16px 32px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center">${footerParts}</td></tr>` : ''}
</table>
</td></tr>
</table>
</body></html>`;

	const text = `${greeting}

${from} has sent you ${documentType === 'estimate' ? 'an' : 'a'} ${documentType}.

${typeLabel} ${documentNumber}
${totalText}${dueText}
View it here: ${viewUrl}

${footerParts ? `---\n${footerParts}` : ''}`;

	return { html, text };
}

export function generateNotificationEmail(params: NotificationEmailParams): { html: string; text: string } {
	const { documentType, documentNumber, recipientEmail, recipientName, viewUrl, total } = params;

	const typeLabel = capitalize(documentType);
	const recipient = recipientName || recipientEmail;
	const totalLine = total != null ? ` for ${formatCurrency(total)}` : '';

	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
<tr><td style="background:#10b981;padding:20px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">Sent Successfully</h1>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 12px">Your ${typeLabel} <strong>${documentNumber}</strong>${totalLine} was sent to <strong>${recipient}</strong>.</p>
<p style="font-size:13px;color:#888;margin:16px 0 0"><a href="${viewUrl}" style="color:#0066ff">View document</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

	const text = `Your ${typeLabel} ${documentNumber}${totalLine} was sent to ${recipient}.

View: ${viewUrl}`;

	return { html, text };
}
