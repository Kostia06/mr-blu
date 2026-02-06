import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PricingLookupResult {
	found: boolean;
	material: string;
	measurementType: string;
	historicalRatePerUnit: number | null;
	suggestedPrice: number | null;
	confidence: number;
	basedOn: {
		quantity: number;
		total: number;
		date: string;
		usageCount: number;
	} | null;
}

// Round up to nearest increment based on price
function roundUpToIncrement(price: number): number {
	if (price < 100) {
		// Round up to nearest $10
		return Math.ceil(price / 10) * 10;
	} else if (price < 1000) {
		// Round up to nearest $50
		return Math.ceil(price / 50) * 50;
	} else if (price < 5000) {
		// Round up to nearest $100
		return Math.ceil(price / 100) * 100;
	} else {
		// Round up to nearest $250
		return Math.ceil(price / 250) * 250;
	}
}

// Calculate confidence based on recency and usage
function calculateConfidence(lastUsedAt: Date, usageCount: number): number {
	const daysSinceLastUse = Math.floor((Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24));

	// Base confidence starts at 0.7
	let confidence = 0.7;

	// Boost for recent usage (within 30 days)
	if (daysSinceLastUse <= 7) {
		confidence += 0.2;
	} else if (daysSinceLastUse <= 30) {
		confidence += 0.15;
	} else if (daysSinceLastUse <= 90) {
		confidence += 0.05;
	}

	// Boost for multiple uses
	if (usageCount >= 5) {
		confidence += 0.1;
	} else if (usageCount >= 3) {
		confidence += 0.05;
	}

	return Math.min(confidence, 1.0);
}

// Normalize material name for matching
function normalizeMaterial(material: string): string {
	return material
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/[^a-z0-9\s]/g, '');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { material, measurementType, quantity } = await request.json();

		if (!material || !measurementType || typeof quantity !== 'number') {
			return json(
				{ error: 'Missing required fields: material, measurementType, quantity' },
				{ status: 400 }
			);
		}

		const normalizedMaterial = normalizeMaterial(material);

		// Look up pricing memory - try exact match first
		const { data: pricingData, error } = await supabase
			.from('pricing_memory')
			.select('*')
			.eq('user_id', userId)
			.eq('measurement_type', measurementType)
			.ilike('material', `%${normalizedMaterial}%`)
			.order('last_used_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (error) {
			console.error('Pricing lookup error:', error);
			return json({ error: 'Database error' }, { status: 500 });
		}

		// If no exact match, try fuzzy matching
		if (!pricingData) {
			const { data: allPricing } = await supabase
				.from('pricing_memory')
				.select('*')
				.eq('user_id', userId)
				.eq('measurement_type', measurementType)
				.order('last_used_at', { ascending: false });

			if (allPricing && allPricing.length > 0) {
				// Find best match based on word overlap
				const materialWords = normalizedMaterial.split(' ').filter((w) => w.length > 2);
				let bestMatch = null;
				let bestScore = 0;

				for (const pricing of allPricing) {
					const storedWords = normalizeMaterial(pricing.material)
						.split(' ')
						.filter((w) => w.length > 2);
					const matchingWords = materialWords.filter((w) =>
						storedWords.some((sw) => sw.includes(w) || w.includes(sw))
					);
					const score = matchingWords.length / Math.max(materialWords.length, storedWords.length);

					if (score > bestScore && score >= 0.5) {
						bestScore = score;
						bestMatch = pricing;
					}
				}

				pricingData = bestMatch;
			}
		}

		if (!pricingData) {
			const result: PricingLookupResult = {
				found: false,
				material,
				measurementType,
				historicalRatePerUnit: null,
				suggestedPrice: null,
				confidence: 0,
				basedOn: null
			};
			return json(result);
		}

		// Calculate suggested price based on historical rate
		const ratePerUnit = parseFloat(pricingData.rate_per_unit) || 0;
		const rawPrice = ratePerUnit * quantity;
		const suggestedPrice = roundUpToIncrement(rawPrice);
		const confidence = calculateConfidence(
			new Date(pricingData.last_used_at),
			pricingData.usage_count
		);

		const result: PricingLookupResult = {
			found: true,
			material: pricingData.material,
			measurementType: pricingData.measurement_type,
			historicalRatePerUnit: ratePerUnit,
			suggestedPrice,
			confidence,
			basedOn: {
				quantity: parseFloat(pricingData.base_quantity) || 0,
				total: parseFloat(pricingData.base_rate) || 0,
				date: pricingData.last_used_at,
				usageCount: pricingData.usage_count
			}
		};

		return json(result);
	} catch (error) {
		console.error('Pricing lookup error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
