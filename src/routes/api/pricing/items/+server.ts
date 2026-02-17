import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PriceCategory } from '$lib/types/pricing';

export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;
	const category = url.searchParams.get('category') as PriceCategory | null;
	const search = url.searchParams.get('search');

	try {
		let query = supabase
			.from('price_items')
			.select('*')
			.eq('user_id', userId)
			.order('times_used', { ascending: false })
			.order('updated_at', { ascending: false });

		if (category) {
			query = query.eq('category', category);
		}

		if (search) {
			query = query.ilike('name', `%${search}%`);
		}

		const { data, error } = await query;

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ items: data || [] });
	} catch (error) {
		console.error('Price items list error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { name, description, category, unitPrice, unit } = await request.json();

		if (!name || !unitPrice) {
			return json({ error: 'Missing required fields: name, unitPrice' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from('price_items')
			.insert({
				user_id: userId,
				name: name.toLowerCase().trim(),
				description: description || null,
				category: category || 'other',
				unit_price: unitPrice,
				unit: unit || 'each',
				source: 'manual',
				times_used: 0,
				min_price: unitPrice,
				max_price: unitPrice
			})
			.select()
			.single();

		if (error) {
			if (error.code === '23505') {
				return json({ error: 'Item with this name and unit already exists' }, { status: 409 });
			}
			return json({ error: error.message }, { status: 500 });
		}

		return json({ item: data }, { status: 201 });
	} catch (error) {
		console.error('Price item create error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
