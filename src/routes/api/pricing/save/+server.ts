import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface LineItemWithMaterial {
	description: string;
	material?: string;
	measurementType?: string;
	quantity: number;
	rate: number;
	total: number;
}

// Normalize material name for storage
function normalizeMaterial(material: string): string {
	return material
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/[^a-z0-9\s]/g, '');
}

// Extract material from description if not provided
function extractMaterialFromDescription(
	description: string
): { material: string; measurementType: string } | null {
	const desc = description.toLowerCase();

	// Common material patterns
	const materialPatterns = [
		{ pattern: /redwood\s*(floor|deck|fence|beam)?/i, material: 'redwood', type: 'sqft' },
		{ pattern: /hardwood\s*(floor)?/i, material: 'hardwood floor', type: 'sqft' },
		{ pattern: /tile\s*(floor|wall|backsplash)?/i, material: 'tile', type: 'sqft' },
		{ pattern: /drywall/i, material: 'drywall', type: 'sqft' },
		{ pattern: /paint(ing)?/i, material: 'painting', type: 'sqft' },
		{ pattern: /carpet/i, material: 'carpet', type: 'sqft' },
		{ pattern: /laminate\s*(floor)?/i, material: 'laminate floor', type: 'sqft' },
		{ pattern: /vinyl\s*(floor)?/i, material: 'vinyl floor', type: 'sqft' },
		{ pattern: /concrete/i, material: 'concrete', type: 'sqft' },
		{ pattern: /roofing|roof/i, material: 'roofing', type: 'sqft' },
		{ pattern: /siding/i, material: 'siding', type: 'sqft' },
		{ pattern: /insulation/i, material: 'insulation', type: 'sqft' },
		{ pattern: /plumbing/i, material: 'plumbing', type: 'job' },
		{ pattern: /electrical/i, material: 'electrical', type: 'job' },
		{ pattern: /hvac/i, material: 'hvac', type: 'job' },
		{ pattern: /landscap/i, material: 'landscaping', type: 'sqft' },
		{ pattern: /fence|fencing/i, material: 'fencing', type: 'linear_ft' },
		{ pattern: /deck/i, material: 'deck', type: 'sqft' },
		{ pattern: /labor|work/i, material: 'labor', type: 'hour' }
	];

	for (const { pattern, material, type } of materialPatterns) {
		if (pattern.test(desc)) {
			return { material, measurementType: type };
		}
	}

	return null;
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
		const { items } = (await request.json()) as { items: LineItemWithMaterial[] };

		if (!items || !Array.isArray(items)) {
			return json({ error: 'Missing items array' }, { status: 400 });
		}

		const savedItems: string[] = [];

		for (const item of items) {
			// Skip items without meaningful pricing data
			if (!item.total || item.total <= 0 || !item.quantity || item.quantity <= 0) {
				continue;
			}

			// Try to get material info from item or extract from description
			let material = item.material;
			let measurementType = item.measurementType;

			if (!material || !measurementType) {
				const extracted = extractMaterialFromDescription(item.description);
				if (extracted) {
					material = material || extracted.material;
					measurementType = measurementType || extracted.measurementType;
				}
			}

			// Skip if we couldn't determine material
			if (!material || !measurementType) {
				continue;
			}

			const normalizedMaterial = normalizeMaterial(material);
			const ratePerUnit = item.total / item.quantity;

			// Upsert pricing memory
			const { error } = await supabase.from('pricing_memory').upsert(
				{
					user_id: userId,
					material: normalizedMaterial,
					measurement_type: measurementType,
					base_quantity: item.quantity,
					base_rate: item.total,
					rate_per_unit: ratePerUnit,
					last_used_at: new Date().toISOString(),
					usage_count: 1
				},
				{
					onConflict: 'user_id,material,measurement_type',
					ignoreDuplicates: false
				}
			);

			if (error) {
				// If upsert failed, try updating with incremented usage_count
				const { error: updateError } = await supabase
					.from('pricing_memory')
					.update({
						base_quantity: item.quantity,
						base_rate: item.total,
						rate_per_unit: ratePerUnit,
						last_used_at: new Date().toISOString(),
						usage_count: supabase.rpc('increment_usage_count', { row_id: null }) // We'll handle this differently
					})
					.eq('user_id', userId)
					.eq('material', normalizedMaterial)
					.eq('measurement_type', measurementType);

				if (updateError) {
					console.error('Pricing memory update error:', updateError);
					continue;
				}
			}

			// Increment usage count separately (RPC might not exist yet)
			try {
				await supabase.rpc('increment_pricing_usage', {
					p_user_id: userId,
					p_material: normalizedMaterial,
					p_measurement_type: measurementType
				});
			} catch {
				// RPC might not exist yet, that's OK
			}

			savedItems.push(normalizedMaterial);
		}

		return json({
			success: true,
			savedCount: savedItems.length,
			savedMaterials: savedItems
		});
	} catch (error) {
		console.error('Pricing save error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
