import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	// Fetch review sessions
	const { data: reviews, error } = await locals.supabase
		.from('review_sessions')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false })
		.limit(50);

	if (error) {
		console.error('Error fetching reviews:', error);
	}

	return {
		reviews: reviews || []
	};
};
