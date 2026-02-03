import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const { data: invoices, error } = await supabase
			.from('invoices')
			.select('id, document_number, client_name, total, created_at, document_type')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5);

		if (error) {
			console.error('Error fetching recent documents:', error);
			return json({ error: 'Failed to fetch documents', success: false }, { status: 500 });
		}

		return json(
			{
				success: true,
				documents: invoices || []
			},
			{
				headers: {
					'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
				}
			}
		);
	} catch (error) {
		console.error('Recent documents error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
