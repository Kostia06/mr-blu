import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function roundUpToIncrement(price: number): number {
	if (price < 100) {
		return Math.ceil(price / 10) * 10;
	} else if (price < 1000) {
		return Math.ceil(price / 50) * 50;
	} else if (price < 5000) {
		return Math.ceil(price / 100) * 100;
	} else {
		return Math.ceil(price / 250) * 250;
	}
}

function calculateConfidence(lastUsedAt: Date, usageCount: number): number {
	const daysSinceLastUse = Math.floor(
		(Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24)
	);

	let confidence = 0.7;

	if (daysSinceLastUse <= 7) {
		confidence += 0.2;
	} else if (daysSinceLastUse <= 30) {
		confidence += 0.15;
	} else if (daysSinceLastUse <= 90) {
		confidence += 0.05;
	}

	if (usageCount >= 5) {
		confidence += 0.1;
	} else if (usageCount >= 3) {
		confidence += 0.05;
	}

	return Math.min(confidence, 1.0);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { description, quantity } = await request.json();

		if (!description || typeof quantity !== 'number') {
			return json(
				{ error: 'Missing required fields: description, quantity' },
				{ status: 400 }
			);
		}

		const normalizedName = description.toLowerCase().trim();

		// Try exact match first (by name)
		const { data: exactMatch } = await supabase
			.from('price_items')
			.select('*')
			.eq('user_id', userId)
			.ilike('name', normalizedName)
			.order('last_used_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (exactMatch) {
			const unitPrice = parseFloat(exactMatch.unit_price);
			const rawPrice = unitPrice * quantity;
			const suggestedPrice = roundUpToIncrement(rawPrice);
			const confidence = calculateConfidence(
				new Date(exactMatch.last_used_at),
				exactMatch.times_used
			);

			return json({
				found: true,
				name: exactMatch.name,
				unitPrice,
				unit: exactMatch.unit,
				suggestedPrice,
				confidence,
				basedOn: {
					timesUsed: exactMatch.times_used,
					lastUsed: exactMatch.last_used_at,
					minPrice: parseFloat(exactMatch.min_price),
					maxPrice: parseFloat(exactMatch.max_price)
				}
			});
		}

		// Fall back to fuzzy search via pg_trgm
		const { data: fuzzyResults } = await supabase.rpc('search_price_items', {
			p_user_id: userId,
			p_query: normalizedName,
			p_limit: 1
		});

		if (fuzzyResults && fuzzyResults.length > 0) {
			const match = fuzzyResults[0];
			const unitPrice = parseFloat(match.unit_price);
			const rawPrice = unitPrice * quantity;
			const suggestedPrice = roundUpToIncrement(rawPrice);
			const baseConfidence = calculateConfidence(
				new Date(match.last_used_at),
				match.times_used
			);
			const confidence = baseConfidence * match.similarity;

			return json({
				found: true,
				name: match.name,
				unitPrice,
				unit: match.unit,
				suggestedPrice,
				confidence,
				basedOn: {
					timesUsed: match.times_used,
					lastUsed: match.last_used_at,
					minPrice: parseFloat(match.min_price),
					maxPrice: parseFloat(match.max_price)
				}
			});
		}

		return json({
			found: false,
			name: description,
			unitPrice: null,
			suggestedPrice: null,
			confidence: 0,
			basedOn: null
		});
	} catch (error) {
		console.error('Pricing lookup error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
