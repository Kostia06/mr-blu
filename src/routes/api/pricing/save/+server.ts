import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inferCategory } from '$lib/types/pricing';

interface LineItemInput {
	description: string;
	quantity: number;
	rate: number;
	total: number;
	measurementType?: string;
	unit?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { items } = (await request.json()) as { items: LineItemInput[] };

		if (!items || !Array.isArray(items)) {
			return json({ error: 'Missing items array' }, { status: 400 });
		}

		const savedItems: string[] = [];

		for (const item of items) {
			if (!item.total || item.total <= 0 || !item.quantity || item.quantity <= 0) {
				continue;
			}

			if (!item.description?.trim()) {
				continue;
			}

			const unitPrice = item.total / item.quantity;
			const unit = item.measurementType || item.unit || 'each';
			const name = item.description.toLowerCase().trim();
			const category = inferCategory(item.description);

			const { error } = await supabase.rpc('upsert_price_item', {
				p_user_id: userId,
				p_name: name,
				p_description: item.description,
				p_category: category,
				p_unit_price: unitPrice,
				p_unit: unit,
				p_source: 'voice'
			});

			if (error) {
				console.error('Price item upsert error:', error);
				continue;
			}

			savedItems.push(name);
		}

		return json({
			success: true,
			savedCount: savedItems.length,
			savedItems
		});
	} catch (error) {
		console.error('Pricing save error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
