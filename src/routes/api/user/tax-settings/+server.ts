import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { UserTaxSettings, TaxComponent, TaxCalculationMode } from '$lib/types/tax';

/**
 * GET /api/user/tax-settings
 * Get user's tax settings
 */
export const GET: RequestHandler = async ({ locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { data: profile, error } = await supabase
			.from('profiles')
			.select(
				'default_tax_region, default_tax_config, tax_calculation_mode, tax_registration_numbers'
			)
			.eq('id', userId)
			.single();

		if (error) {
			// Profile might not exist or columns might not exist
			if (error.code === 'PGRST116') {
				// Return default settings
				return json({
					success: true,
					data: {
						defaultTaxRegion: null,
						defaultTaxConfig: null,
						taxCalculationMode: 'exclusive',
						taxRegistrationNumbers: null
					} as unknown as UserTaxSettings
				});
			}
			throw error;
		}

		const settings: UserTaxSettings = {
			defaultTaxRegion: profile?.default_tax_region || null,
			defaultTaxConfig: profile?.default_tax_config || null,
			taxCalculationMode: (profile?.tax_calculation_mode || 'exclusive') as TaxCalculationMode,
			taxRegistrationNumbers: profile?.tax_registration_numbers || undefined
		};

		return json({
			success: true,
			data: settings
		});
	} catch (error) {
		console.error('Error fetching tax settings:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to fetch tax settings'
			},
			{ status: 500 }
		);
	}
};

/**
 * PUT /api/user/tax-settings
 * Update user's tax settings
 */
export const PUT: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const body = await request.json();
		const {
			defaultTaxRegion,
			defaultTaxConfig,
			taxCalculationMode,
			taxRegistrationNumbers
		}: Partial<UserTaxSettings> = body;

		// Validate tax calculation mode
		if (taxCalculationMode && !['exclusive', 'inclusive'].includes(taxCalculationMode)) {
			return json({ error: 'Invalid tax calculation mode' }, { status: 400 });
		}

		// Validate tax config structure
		if (defaultTaxConfig) {
			if (!Array.isArray(defaultTaxConfig)) {
				return json({ error: 'defaultTaxConfig must be an array' }, { status: 400 });
			}

			for (const tax of defaultTaxConfig as TaxComponent[]) {
				if (!tax.type || typeof tax.rate !== 'number') {
					return json({ error: 'Invalid tax component structure' }, { status: 400 });
				}
				if (tax.rate < 0 || tax.rate > 100) {
					return json({ error: 'Tax rate must be between 0 and 100' }, { status: 400 });
				}
			}
		}

		// Build update object
		const updateData: Record<string, unknown> = {};
		if (defaultTaxRegion !== undefined) updateData.default_tax_region = defaultTaxRegion;
		if (defaultTaxConfig !== undefined) updateData.default_tax_config = defaultTaxConfig;
		if (taxCalculationMode !== undefined) updateData.tax_calculation_mode = taxCalculationMode;
		if (taxRegistrationNumbers !== undefined)
			updateData.tax_registration_numbers = taxRegistrationNumbers;

		const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);

		if (error) {
			throw error;
		}

		return json({
			success: true,
			message: 'Tax settings updated'
		});
	} catch (error) {
		console.error('Error updating tax settings:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to update tax settings'
			},
			{ status: 500 }
		);
	}
};
