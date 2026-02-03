import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Only allow in development mode
	if (!dev) {
		throw redirect(302, '/dashboard');
	}

	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		throw redirect(302, '/login');
	}

	return {
		isDev: true
	};
};
