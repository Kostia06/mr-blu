import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	const severity = url.searchParams.get('severity') || null;
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	let query = locals.supabase
		.from('error_logs')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (severity) {
		query = query.eq('severity', severity);
	}

	const { data: errors, count, error } = await query;

	if (error) {
		console.error('Failed to fetch error logs:', error);
	}

	return {
		errors: errors || [],
		totalCount: count || 0,
		page,
		limit,
		severity
	};
};
