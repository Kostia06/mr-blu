import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET - List review sessions
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const status = url.searchParams.get('status');
		const limit = parseInt(url.searchParams.get('limit') || '20');

		let query = supabase
			.from('review_sessions')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (status) {
			query = query.eq('status', status);
		}

		const { data: reviews, error } = await query;

		if (error) {
			console.error('Error fetching reviews:', error);
			return json({ error: 'Failed to fetch reviews', success: false }, { status: 500 });
		}

		return json({
			success: true,
			reviews: reviews || []
		});
	} catch (error) {
		console.error('Reviews list error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};

// POST - Create a new review session
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const body = await request.json();
		const {
			originalTranscript,
			audioUrl,
			intentType,
			parsedData,
			actions,
			queryData,
			queryResult,
			sourceDocumentId,
			sourceDocumentType,
			confidence,
			summary,
			status = 'pending'
		} = body;

		const { data: review, error } = await supabase
			.from('review_sessions')
			.insert({
				user_id: userId,
				original_transcript: originalTranscript,
				audio_url: audioUrl,
				intent_type: intentType || 'document_action',
				parsed_data: parsedData || {},
				actions: actions || [],
				query_data: queryData,
				query_result: queryResult,
				source_document_id: sourceDocumentId,
				source_document_type: sourceDocumentType,
				confidence: confidence,
				summary: summary,
				status: status
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating review:', error);
			return json({ error: 'Failed to create review', success: false }, { status: 500 });
		}

		return json({
			success: true,
			review
		});
	} catch (error) {
		console.error('Review create error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
