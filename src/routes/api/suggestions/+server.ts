import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Clean corrupted unit strings
function cleanUnit(unit: string | undefined | null): string {
	if (!unit || typeof unit !== 'string') return 'unit';

	const trimmed = unit.trim();

	// If it's just a number, return 'unit'
	if (/^\d+$/.test(trimmed)) return 'unit';

	// If it contains garbage characters (@ $ null etc), extract clean word
	if (trimmed.includes('@') || trimmed.includes('$') || trimmed.includes('null')) {
		const cleanWord = trimmed
			.replace(/[\d@$,.\s]+/g, ' ')
			.trim()
			.split(/\s+/)[0];
		if (cleanWord && cleanWord !== 'null' && cleanWord.length > 0 && cleanWord.length <= 15) {
			return cleanWord;
		}
		return 'unit';
	}

	// If clean and reasonable length, use it
	if (trimmed.length > 0 && trimmed.length <= 15 && /^[a-zA-Z]+$/.test(trimmed)) {
		return trimmed;
	}

	return 'unit';
}

// GET - Get suggestions for various fields
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const type = url.searchParams.get('type');

	try {
		switch (type) {
			case 'items': {
				// Get common line items from previous invoices
				const { data: invoices } = await supabase
					.from('invoices')
					.select('line_items')
					.eq('user_id', userId)
					.order('created_at', { ascending: false })
					.limit(50);

				// Also get from common_items table
				const { data: commonItems } = await supabase
					.from('common_items')
					.select('*')
					.eq('user_id', userId)
					.order('use_count', { ascending: false })
					.limit(20);

				// Extract unique items from invoices
				const itemMap = new Map<
					string,
					{ description: string; rate: number; count: number; unit: string }
				>();

				for (const invoice of invoices || []) {
					const items =
						(invoice.line_items as Array<{ description: string; rate: number; unit?: string }>) ||
						[];
					for (const item of items) {
						if (item.description) {
							const key = item.description.toLowerCase().trim();
							const existing = itemMap.get(key);
							if (existing) {
								existing.count++;
								// Keep the most common rate
							} else {
								itemMap.set(key, {
									description: item.description,
									rate: item.rate || 0,
									unit: cleanUnit(item.unit),
									count: 1
								});
							}
						}
					}
				}

				// Merge with common_items
				for (const item of commonItems || []) {
					const key = item.description.toLowerCase().trim();
					const existing = itemMap.get(key);
					if (existing) {
						existing.count += item.use_count || 1;
					} else {
						itemMap.set(key, {
							description: item.description,
							rate: item.default_rate || 0,
							unit: cleanUnit(item.default_unit),
							count: item.use_count || 1
						});
					}
				}

				// Convert to array and sort by usage
				const suggestions = Array.from(itemMap.values())
					.sort((a, b) => b.count - a.count)
					.slice(0, 20);

				return json({ success: true, suggestions });
			}

			case 'amounts': {
				// Get common amounts from previous invoices
				const { data: invoices } = await supabase
					.from('invoices')
					.select('total, line_items')
					.eq('user_id', userId)
					.order('created_at', { ascending: false })
					.limit(100);

				const amountCounts = new Map<number, number>();

				for (const invoice of invoices || []) {
					// Track totals
					if (invoice.total) {
						const rounded = Math.round(invoice.total);
						amountCounts.set(rounded, (amountCounts.get(rounded) || 0) + 1);
					}

					// Track line item rates
					const items = (invoice.line_items as Array<{ rate: number }>) || [];
					for (const item of items) {
						if (item.rate) {
							const rounded = Math.round(item.rate);
							amountCounts.set(rounded, (amountCounts.get(rounded) || 0) + 1);
						}
					}
				}

				const suggestions = Array.from(amountCounts.entries())
					.map(([amount, count]) => ({ amount, count }))
					.sort((a, b) => b.count - a.count)
					.slice(0, 10);

				return json({ success: true, suggestions });
			}

			case 'statuses': {
				// Return available statuses
				const suggestions = [
					{ value: 'draft', label: 'Draft', description: 'Not yet sent' },
					{ value: 'sent', label: 'Sent', description: 'Sent to client' },
					{ value: 'paid', label: 'Paid', description: 'Payment received' },
					{ value: 'overdue', label: 'Overdue', description: 'Past due date' },
					{ value: 'partial', label: 'Partial', description: 'Partially paid' }
				];
				return json({ success: true, suggestions });
			}

			default:
				return json({ error: 'Invalid suggestion type', success: false }, { status: 400 });
		}
	} catch (error) {
		console.error('Suggestions error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};

// POST - Track item usage (for learning)
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const { items } = await request.json();

		if (!items || !Array.isArray(items)) {
			return json({ error: 'Items array required', success: false }, { status: 400 });
		}

		// Upsert items into common_items
		for (const item of items) {
			if (!item.description) continue;

			// Check if exists
			const { data: existing } = await supabase
				.from('common_items')
				.select('id, use_count')
				.eq('user_id', userId)
				.ilike('description', item.description)
				.single();

			if (existing) {
				// Update use count
				await supabase
					.from('common_items')
					.update({
						use_count: (existing.use_count || 0) + 1,
						last_used_at: new Date().toISOString(),
						default_rate: item.rate || undefined
					})
					.eq('id', existing.id);
			} else {
				// Insert new
				await supabase.from('common_items').insert({
					user_id: userId,
					description: item.description,
					default_quantity: item.quantity || 1,
					default_unit: cleanUnit(item.unit),
					default_rate: item.rate || null,
					use_count: 1
				});
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Track items error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
