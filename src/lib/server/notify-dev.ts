import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM_DOMAIN } from '$env/static/private';
import { env } from '$env/dynamic/private';

const DEV_EMAIL = 'dev@mrblu.com';

// Check if notifications are enabled (defaults to true if not set)
const notificationsEnabled = env.ENABLE_DEV_NOTIFICATIONS !== 'false';
const resend = RESEND_API_KEY && notificationsEnabled ? new Resend(RESEND_API_KEY) : null;

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getFromAddress(): string {
	return EMAIL_FROM_DOMAIN ? `Mr. Blu <dev@${EMAIL_FROM_DOMAIN}>` : 'Mr. Blu <dev@mrblu.com>';
}

/**
 * Send feedback notification email to dev (fire-and-forget).
 */
export function notifyFeedback(opts: {
	category: string;
	comment: string;
	pageContext?: string | null;
	userId: string;
}): void {
	if (!resend) return;

	const { category, comment, pageContext, userId } = opts;
	const categoryColors: Record<string, string> = {
		bug: '#dc2626',
		feature: '#8b5cf6',
		general: '#0066FF',
		praise: '#22c55e',
		complaint: '#f59e0b'
	};
	const color = categoryColors[category] || '#0066FF';

	resend.emails
		.send({
			from: getFromAddress(),
			to: [DEV_EMAIL],
			subject: `[Feedback/${category}] New ${category} from user`,
			html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border-top: 4px solid ${color};">
    <div style="margin-bottom: 16px;">
      <span style="font-size: 20px; font-weight: 700; color: #0066FF;">mrblu</span>
      <span style="font-size: 14px; color: #94a3b8; margin-left: 8px;">Feedback</span>
    </div>
    <div style="display: inline-block; background: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
      ${category}
    </div>
    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(comment)}</p>
    </div>
    <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
      <p style="margin: 0 0 4px;">Page: ${escapeHtml(pageContext || '—')}</p>
      <p style="margin: 0;">User: ${userId.substring(0, 8)}...</p>
    </div>
  </div>
</body>
</html>`
		})
		.catch((err) => console.error('[notify-dev] feedback email failed:', err));
}

/**
 * Send error notification email to dev (fire-and-forget).
 * Only call for error/critical severity.
 */
export function notifyError(opts: {
	severity: string;
	errorType: string;
	message: string;
	stack?: string;
	requestPath?: string;
	requestMethod?: string;
	statusCode?: number;
	userId?: string;
}): void {
	if (!resend) return;

	const { severity, errorType, message, stack, requestPath, requestMethod, statusCode, userId } =
		opts;
	const isCritical = severity === 'critical';
	const color = isCritical ? '#dc2626' : '#f59e0b';

	resend.emails
		.send({
			from: getFromAddress(),
			to: [DEV_EMAIL],
			subject: `[${severity.toUpperCase()}] ${errorType}: ${message.substring(0, 80)}`,
			html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border-top: 4px solid ${color};">
    <div style="margin-bottom: 16px;">
      <span style="font-size: 20px; font-weight: 700; color: #0066FF;">mrblu</span>
      <span style="font-size: 14px; color: #94a3b8; margin-left: 8px;">Error Alert</span>
    </div>
    <div style="display: inline-block; background: ${color}15; color: ${color}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px;">
      ${severity}
    </div>
    <h2 style="margin: 0 0 8px; font-size: 16px; color: #0f172a;">${escapeHtml(errorType)}</h2>
    <p style="margin: 0 0 16px; font-size: 14px; color: #475569; line-height: 1.5;">${escapeHtml(message)}</p>
    ${
			stack
				? `<details style="margin-bottom: 16px;">
      <summary style="font-size: 12px; color: #64748b; cursor: pointer; margin-bottom: 8px;">Stack trace</summary>
      <pre style="background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 8px; font-size: 11px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">${escapeHtml(stack.substring(0, 2000))}</pre>
    </details>`
				: ''
		}
    <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
      <p style="margin: 0 0 4px;">Route: ${requestMethod || '—'} ${escapeHtml(requestPath || '—')}</p>
      <p style="margin: 0 0 4px;">Status: ${statusCode || '—'}</p>
      <p style="margin: 0;">User: ${userId ? userId.substring(0, 8) + '...' : '—'}</p>
    </div>
  </div>
</body>
</html>`
		})
		.catch((err) => console.error('[notify-dev] error email failed:', err));
}
