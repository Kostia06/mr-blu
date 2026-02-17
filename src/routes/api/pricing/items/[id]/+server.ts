import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const updates = await request.json();

		const allowedFields = ['name', 'description', 'category', 'unit_price', 'unit'];
		const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };

		for (const field of allowedFields) {
			if (updates[field] !== undefined) {
				sanitized[field] =
					field === 'name' ? updates[field].toLowerCase().trim() : updates[field];
			}
		}

		const { data, error } = await supabase
			.from('price_items')
			.update(sanitized)
			.eq('id', params.id)
			.eq('user_id', userId)
			.select()
			.single();

		if (error) {
			if (error.code === '23505') {
				return json({ error: 'Item with this name and unit already exists' }, { status: 409 });
			}
			return json({ error: error.message }, { status: 500 });
		}

		if (!data) {
			return json({ error: 'Not found' }, { status: 404 });
		}

		return json({ item: data });
	} catch (error) {
		console.error('Price item update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { error } = await supabase
			.from('price_items')
			.delete()
			.eq('id', params.id)
			.eq('user_id', userId);

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Price item delete error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
