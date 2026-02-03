import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	// Allow child routes to invalidate user data after profile updates
	depends('app:user');

	const { session, user } = await locals.safeGetSession();
	return { session, user };
};
