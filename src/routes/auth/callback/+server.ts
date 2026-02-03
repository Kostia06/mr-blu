import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (code) {
		const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Auth callback error:', error.message);
			throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
		}

		throw redirect(303, next);
	}

	// No code provided
	throw redirect(303, '/login');
};
