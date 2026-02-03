import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sanitizeString } from '$lib/server/security';
import { logger } from '$lib/server/logger';
import { notifyFeedback } from '$lib/server/notify-dev';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	try {
		const { comment, category, pageContext } = await request.json();

		if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
			return json({ error: 'Comment is required', success: false }, { status: 400 });
		}

		if (comment.length > 2000) {
			return json({ error: 'Comment too long (max 2000 characters)', success: false }, { status: 400 });
		}

		const validCategories = ['general', 'bug', 'feature', 'complaint', 'praise'];
		const safeCategory = validCategories.includes(category) ? category : 'general';

		const { error: insertError } = await locals.supabase.from('admin_comments').insert({
			user_id: session.user.id,
			comment: sanitizeString(comment.trim()),
			category: safeCategory,
			page_context: pageContext ? sanitizeString(pageContext) : null
		});

		if (!insertError) {
			notifyFeedback({
				category: safeCategory,
				comment: comment.trim(),
				pageContext: pageContext || null,
				userId: session.user.id
			});
		}

		if (insertError) {
			logger.error('feedback_submit', insertError.message, {
				user_id: session.user.id,
				request_path: '/api/feedback',
				request_method: 'POST'
			});
			return json({ error: 'Failed to submit feedback', success: false }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('feedback_submit', err.message, {
			user_id: session.user.id,
			request_path: '/api/feedback',
			request_method: 'POST'
		});
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
