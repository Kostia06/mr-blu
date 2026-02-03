/**
 * Usage Limits Utility
 *
 * Tracks document creation against plan limits.
 * Currently shows limits but does NOT enforce them.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface UsageLimitInfo {
	planType: 'free' | 'pro' | 'enterprise';
	invoices: { used: number; limit: number };
	estimates: { used: number; limit: number };
	contracts: { used: number; limit: number };
	aiRequests: { used: number; limit: number };
	voiceMinutes: { used: number; limit: number };
	periodEnd: string;
}

export interface LimitCheckResult {
	allowed: boolean; // Always true for now (limits not enforced)
	usage: UsageLimitInfo;
	message?: string;
}

const DEFAULT_FREE_LIMITS = {
	max_invoices_per_month: 10,
	max_estimates_per_month: 10,
	max_contracts_per_month: 5,
	max_ai_requests_per_month: 50,
	max_voice_minutes_per_month: 30
};

/**
 * Get current usage limits for a user
 */
export async function getUserUsage(
	supabase: SupabaseClient,
	userId: string
): Promise<UsageLimitInfo | null> {
	try {
		// Get user's usage record
		const { data: usage, error: usageError } = await supabase
			.from('usage_limits')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (usageError && usageError.code !== 'PGRST116') {
			console.error('Error fetching usage limits:', usageError);
		}

		// Get plan limits
		const planType = usage?.plan_type || 'free';
		const { data: planLimits } = await supabase
			.from('plan_limits')
			.select('*')
			.eq('plan_type', planType)
			.single();

		const limits = planLimits || DEFAULT_FREE_LIMITS;

		// Check if period needs reset
		let currentUsage = usage;
		if (usage && new Date(usage.current_period_end) < new Date()) {
			// Reset period
			const newPeriodEnd = new Date();
			newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

			const { data: updatedUsage } = await supabase
				.from('usage_limits')
				.update({
					invoices_created_this_month: 0,
					estimates_created_this_month: 0,
					contracts_created_this_month: 0,
					ai_requests_this_month: 0,
					voice_minutes_used_this_month: 0,
					current_period_start: new Date().toISOString(),
					current_period_end: newPeriodEnd.toISOString()
				})
				.eq('user_id', userId)
				.select()
				.single();

			currentUsage = updatedUsage || usage;
		}

		return {
			planType: planType as 'free' | 'pro' | 'enterprise',
			invoices: {
				used: currentUsage?.invoices_created_this_month || 0,
				limit: limits.max_invoices_per_month
			},
			estimates: {
				used: currentUsage?.estimates_created_this_month || 0,
				limit: limits.max_estimates_per_month
			},
			contracts: {
				used: currentUsage?.contracts_created_this_month || 0,
				limit: limits.max_contracts_per_month
			},
			aiRequests: {
				used: currentUsage?.ai_requests_this_month || 0,
				limit: limits.max_ai_requests_per_month
			},
			voiceMinutes: {
				used: currentUsage?.voice_minutes_used_this_month || 0,
				limit: limits.max_voice_minutes_per_month
			},
			periodEnd:
				currentUsage?.current_period_end ||
				new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
		};
	} catch (error) {
		console.error('Error in getUserUsage:', error);
		return null;
	}
}

/**
 * Increment usage counter for a document type
 * Returns the updated usage info
 */
export async function incrementUsage(
	supabase: SupabaseClient,
	userId: string,
	documentType: 'invoice' | 'estimate' | 'contract'
): Promise<LimitCheckResult> {
	// First ensure user has a usage_limits record
	const { data: existing } = await supabase
		.from('usage_limits')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (!existing) {
		// Create usage record
		const periodEnd = new Date();
		periodEnd.setMonth(periodEnd.getMonth() + 1);

		await supabase.from('usage_limits').insert({
			user_id: userId,
			plan_type: 'free',
			current_period_start: new Date().toISOString(),
			current_period_end: periodEnd.toISOString()
		});
	}

	// Determine which column to increment
	const columnMap = {
		invoice: 'invoices_created_this_month',
		estimate: 'estimates_created_this_month',
		contract: 'contracts_created_this_month'
	};

	const lifetimeColumnMap = {
		invoice: 'total_invoices_created',
		estimate: 'total_invoices_created', // Using same column for estimates
		contract: 'total_invoices_created' // Using same column for contracts
	};

	const column = columnMap[documentType];
	const lifetimeColumn = lifetimeColumnMap[documentType];

	// Get current value and increment
	const { data: currentUsage } = await supabase
		.from('usage_limits')
		.select(column)
		.eq('user_id', userId)
		.single();

	const usageRecord = currentUsage as Record<string, number> | null;
	const currentValue = usageRecord?.[column] ?? 0;
	const currentLifetimeValue = usageRecord?.[lifetimeColumn] ?? 0;

	// Increment the counter
	await supabase
		.from('usage_limits')
		.update({
			[column]: currentValue + 1,
			[lifetimeColumn]: currentLifetimeValue + 1
		})
		.eq('user_id', userId);

	// Get updated usage info
	const usage = await getUserUsage(supabase, userId);

	if (!usage) {
		return {
			allowed: true,
			usage: {
				planType: 'free',
				invoices: { used: 1, limit: 10 },
				estimates: { used: 0, limit: 10 },
				contracts: { used: 0, limit: 5 },
				aiRequests: { used: 0, limit: 50 },
				voiceMinutes: { used: 0, limit: 30 },
				periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
			}
		};
	}

	// Check if limit was hit (but don't enforce)
	const typeMap = {
		invoice: usage.invoices,
		estimate: usage.estimates,
		contract: usage.contracts
	};

	const typeUsage = typeMap[documentType];
	const limitHit = typeUsage.limit !== -1 && typeUsage.used >= typeUsage.limit;

	return {
		allowed: true, // Always allow for now
		usage,
		message: limitHit
			? `You've reached your monthly ${documentType} limit (${typeUsage.used}/${typeUsage.limit}). Upgrade to Pro for unlimited documents.`
			: undefined
	};
}

/**
 * Format usage for display
 */
export function formatUsageDisplay(
	usage: UsageLimitInfo,
	type: 'invoice' | 'estimate' | 'contract'
): string {
	const typeMap = {
		invoice: usage.invoices,
		estimate: usage.estimates,
		contract: usage.contracts
	};

	const { used, limit } = typeMap[type];

	if (limit === -1) {
		return `${used} created`; // Unlimited
	}

	return `${used}/${limit} this month`;
}
