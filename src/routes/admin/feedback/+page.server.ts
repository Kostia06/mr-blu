import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	const category = url.searchParams.get('category') || null;
	const unreadOnly = url.searchParams.get('unread') === 'true';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	let query = locals.supabase
		.from('feedback')
		.select('*, profiles(full_name, email)', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (category) {
		query = query.eq('category', category);
	}

	if (unreadOnly) {
		query = query.is('responded_at', null);
	}

	const { data: feedback, count, error } = await query;

	if (error) {
		console.error('Failed to fetch feedback:', error);
	}

	return {
		feedback: feedback || [],
		totalCount: count || 0,
		page,
		limit,
		category,
		unreadOnly
	};
};
