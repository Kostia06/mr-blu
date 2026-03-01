import type { Env, AuthenticatedData } from '../../types';

export const onRequestPost: PagesFunction<Env, string, AuthenticatedData> = async ({
	env,
	data,
}) => {
	const userId = data.user.id;

	// Delete user from Supabase Auth (requires service role)
	const response = await fetch(
		`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`,
		{
			method: 'DELETE',
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	);

	if (!response.ok) {
		const error = await response.text();
		console.error('Failed to delete user:', error);
		return new Response(JSON.stringify({ error: 'Failed to delete account' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ success: true }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
