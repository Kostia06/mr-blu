import type { Env, AuthenticatedData } from '../../types';

function json(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

async function isAdmin(email: string, env: Env): Promise<boolean> {
	const response = await fetch(
		`${env.SUPABASE_URL}/rest/v1/admin_list?email=eq.${encodeURIComponent(email)}&select=email`,
		{
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	);
	if (!response.ok) return false;
	const rows = (await response.json()) as { email: string }[];
	return rows.length > 0;
}

export const onRequest: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
	const { request, data, env } = context;
	const userEmail = data.user?.email;

	if (!userEmail || !(await isAdmin(userEmail, env))) {
		return json({ error: 'Forbidden' }, 403);
	}

	if (request.method === 'GET') {
		const response = await fetch(
			`${env.SUPABASE_URL}/rest/v1/admin_comments?select=id,user_id,comment,category,page_context,created_at,profiles(email,full_name)&order=created_at.desc&limit=100`,
			{
				headers: {
					apikey: env.SUPABASE_SERVICE_ROLE_KEY,
					Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
				},
			},
		);

		if (!response.ok) return json({ error: 'Failed to fetch feedback' }, 500);
		const data = await response.json();
		return json({ feedback: data });
	}

	if (request.method === 'POST') {
		const body = (await request.json()) as { action: string; id?: string };

		if (body.action === 'delete' && body.id) {
			const response = await fetch(
				`${env.SUPABASE_URL}/rest/v1/admin_comments?id=eq.${body.id}`,
				{
					method: 'DELETE',
					headers: {
						apikey: env.SUPABASE_SERVICE_ROLE_KEY,
						Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
					},
				},
			);
			if (!response.ok) return json({ error: 'Failed to delete' }, 500);
			return json({ success: true });
		}

		return json({ error: 'Invalid action' }, 400);
	}

	return json({ error: 'Method not allowed' }, 405);
};
