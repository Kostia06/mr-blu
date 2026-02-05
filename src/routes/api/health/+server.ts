import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const supabase = locals.supabase;

		// Quick DB ping - use a lightweight query
		const { error } = await supabase.from('documents').select('id').limit(1);

		return json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			db: error ? 'error' : 'ok',
		});
	} catch (e) {
		return json(
			{
				status: 'error',
				message: e instanceof Error ? e.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
