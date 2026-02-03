import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CANADIAN_TAX_PRESETS, CANADIAN_PROVINCE_NAMES, getEffectiveRate } from '$lib/types/tax';
import type { CanadianProvince, RegionalTaxPreset } from '$lib/types/tax';

/**
 * GET /api/tax/presets
 * Returns all Canadian regional tax presets
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Optional region filter
	const regionCode = url.searchParams.get('region');

	try {
		// Build presets from static data
		const presets: RegionalTaxPreset[] = [];

		for (const [code, taxes] of Object.entries(CANADIAN_TAX_PRESETS)) {
			const province = code as CanadianProvince;

			// Skip if filtering by region and doesn't match
			if (regionCode && regionCode.toUpperCase() !== code) {
				continue;
			}

			presets.push({
				id: `preset-${code.toLowerCase()}`,
				regionCode: code,
				regionName: CANADIAN_PROVINCE_NAMES[province],
				countryCode: 'CA',
				taxes,
				effectiveRate: getEffectiveRate(taxes),
				isActive: true
			});
		}

		// Sort by province name
		presets.sort((a, b) => a.regionName.localeCompare(b.regionName));

		return json({
			success: true,
			data: {
				presets,
				total: presets.length
			}
		});
	} catch (error) {
		console.error('Error fetching tax presets:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch tax presets'
			},
			{ status: 500 }
		);
	}
};
