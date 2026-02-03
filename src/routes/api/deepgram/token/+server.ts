import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ locals, platform }) => {
	try {
		// Check authentication
		if (!locals.session?.user) {
			throw error(401, 'Unauthorized');
		}

		// Try multiple sources for the API key
		// 1. Cloudflare platform env (production)
		// 2. SvelteKit dynamic private env (development/local)
		const apiKey = platform?.env?.DEEPGRAM_API_KEY || env.DEEPGRAM_API_KEY;

		if (!apiKey) {
			console.error('Deepgram API key not found in environment');
			// Return empty response instead of error to allow graceful fallback to demo mode
			return json({ apiKey: null, error: 'API key not configured' }, { status: 200 });
		}

		// Return the API key for WebSocket connection
		return json({ apiKey });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Deepgram token error:', err);
		return json({ error: 'Failed to get token' }, { status: 500 });
	}
};
