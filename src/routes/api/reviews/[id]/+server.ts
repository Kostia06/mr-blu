import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET - Get a specific review session
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const reviewId = params.id;

	try {
		const { data: review, error } = await supabase
			.from('review_sessions')
			.select('*')
			.eq('id', reviewId)
			.eq('user_id', userId)
			.single();

		if (error || !review) {
			return json({ error: 'Review not found', success: false }, { status: 404 });
		}

		return json({
			success: true,
			review
		});
	} catch (error) {
		console.error('Review fetch error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};

// PATCH - Update a review session
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const reviewId = params.id;

	try {
		const body = await request.json();
		const updates: Record<string, unknown> = {};

		// Only allow updating specific fields
		const allowedFields = [
			'status',
			'parsed_data',
			'actions',
			'query_data',
			'query_result',
			'created_document_id',
			'created_document_type',
			'summary',
			'completed_at'
		];

		// Map camelCase to snake_case
		const fieldMap: Record<string, string> = {
			parsedData: 'parsed_data',
			queryData: 'query_data',
			queryResult: 'query_result',
			createdDocumentId: 'created_document_id',
			createdDocumentType: 'created_document_type',
			completedAt: 'completed_at'
		};

		for (const [key, value] of Object.entries(body)) {
			const dbField = fieldMap[key] || key;
			if (allowedFields.includes(dbField)) {
				updates[dbField] = value;
			}
		}

		// Auto-set completed_at when status changes to completed
		if (updates.status === 'completed' && !updates.completed_at) {
			updates.completed_at = new Date().toISOString();
		}

		if (Object.keys(updates).length === 0) {
			return json({ error: 'No valid fields to update', success: false }, { status: 400 });
		}

		const { data: review, error } = await supabase
			.from('review_sessions')
			.update(updates)
			.eq('id', reviewId)
			.eq('user_id', userId)
			.select()
			.single();

		if (error) {
			console.error('Error updating review:', error);
			return json({ error: 'Failed to update review', success: false }, { status: 500 });
		}

		return json({
			success: true,
			review
		});
	} catch (error) {
		console.error('Review update error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};

// DELETE - Delete a review session
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const reviewId = params.id;

	try {
		const { error } = await supabase
			.from('review_sessions')
			.delete()
			.eq('id', reviewId)
			.eq('user_id', userId);

		if (error) {
			console.error('Error deleting review:', error);
			return json({ error: 'Failed to delete review', success: false }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Review delete error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
