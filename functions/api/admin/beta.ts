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

async function listBetaSignups(env: Env): Promise<Response> {
	const response = await fetch(
		`${env.SUPABASE_URL}/rest/v1/allowed_emails?select=id,email,status,added_at,confirmed_at,notes&order=added_at.desc`,
		{
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	);

	if (!response.ok) {
		return json({ error: 'Failed to fetch signups' }, 500);
	}

	const data = await response.json();
	return json({ signups: data });
}

async function confirmBetaUser(email: string, env: Env): Promise<Response> {
	const now = new Date().toISOString();

	const response = await fetch(
		`${env.SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}`,
		{
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
				Prefer: 'return=minimal',
			},
			body: JSON.stringify({ status: 'confirmed', confirmed_at: now }),
		},
	);

	if (!response.ok) {
		return json({ error: 'Failed to confirm user' }, 500);
	}

	// Send confirmation email via Resend
	const loginUrl = 'https://mrblu.com/login';
	const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;color:#1f2937;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="font-size:24px;font-weight:700;color:#0066ff;margin:0;">Mr. Blu</h1>
  </div>
  <h2 style="font-size:20px;font-weight:600;margin:0 0 16px;">Your beta access is ready!</h2>
  <p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px;">
    You've been approved for the Mr. Blu beta. You can now sign in and start creating documents with your voice.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background:#0066ff;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">
      Sign In Now
    </a>
  </div>
  <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:32px;">
    Questions? Reply to this email — we'd love to hear from you.
  </p>
</body>
</html>`.trim();

	try {
		await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: 'Mr. Blu <noreply@mrblu.com>',
				to: email,
				subject: 'Your Mr. Blu beta access is ready!',
				html: emailHtml,
			}),
		});
	} catch (err) {
		console.error('Failed to send confirmation email:', err);
	}

	return json({ success: true });
}

async function addBetaUser(email: string, env: Env): Promise<Response> {
	const response = await fetch(`${env.SUPABASE_URL}/rest/v1/allowed_emails`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: env.SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			Prefer: 'resolution=merge-duplicates,return=minimal',
		},
		body: JSON.stringify({
			email,
			status: 'confirmed',
			confirmed_at: new Date().toISOString(),
		}),
	});

	if (!response.ok) {
		return json({ error: 'Failed to add user' }, 500);
	}

	return json({ success: true });
}

async function removeBetaUser(email: string, env: Env): Promise<Response> {
	const response = await fetch(
		`${env.SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}`,
		{
			method: 'DELETE',
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	);

	if (!response.ok) {
		return json({ error: 'Failed to remove user' }, 500);
	}

	return json({ success: true });
}

export const onRequest: PagesFunction<Env, string, AuthenticatedData> = async (context) => {
	const { request, data, env } = context;
	const userEmail = data.user?.email;

	if (!userEmail || !(await isAdmin(userEmail, env))) {
		return json({ error: 'Forbidden' }, 403);
	}

	if (request.method === 'GET') {
		return listBetaSignups(env);
	}

	if (request.method === 'POST') {
		const body = (await request.json()) as { action: string; email?: string };
		const email = body.email?.trim().toLowerCase();

		if (!email) {
			return json({ error: 'Email is required' }, 400);
		}

		switch (body.action) {
			case 'confirm':
				return confirmBetaUser(email, env);
			case 'add':
				return addBetaUser(email, env);
			case 'remove':
				return removeBetaUser(email, env);
			default:
				return json({ error: 'Invalid action' }, 400);
		}
	}

	return json({ error: 'Method not allowed' }, 405);
};
