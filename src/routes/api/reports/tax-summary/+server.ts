import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface TaxSummaryItem {
	taxType: string;
	taxName: string;
	totalAmount: number;
	invoiceCount: number;
}

interface TaxSummaryReport {
	period: {
		start: string;
		end: string;
	};
	summary: {
		totalTaxCollected: number;
		totalInvoices: number;
		totalTaxableAmount: number;
	};
	byTaxType: TaxSummaryItem[];
}

/**
 * GET /api/reports/tax-summary
 * Generate tax summary report for a date range
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	// Parse query parameters
	const startDate = url.searchParams.get('start');
	const endDate = url.searchParams.get('end');
	const period = url.searchParams.get('period'); // 'this_month', 'last_month', 'this_quarter', 'this_year'

	try {
		// Calculate date range
		let start: Date;
		let end: Date;

		if (period) {
			const now = new Date();
			switch (period) {
				case 'this_month':
					start = new Date(now.getFullYear(), now.getMonth(), 1);
					end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
					break;
				case 'last_month':
					start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
					end = new Date(now.getFullYear(), now.getMonth(), 0);
					break;
				case 'this_quarter':
					const quarter = Math.floor(now.getMonth() / 3);
					start = new Date(now.getFullYear(), quarter * 3, 1);
					end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
					break;
				case 'this_year':
					start = new Date(now.getFullYear(), 0, 1);
					end = new Date(now.getFullYear(), 11, 31);
					break;
				default:
					return json({ error: 'Invalid period' }, { status: 400 });
			}
		} else if (startDate && endDate) {
			start = new Date(startDate);
			end = new Date(endDate);

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return json({ error: 'Invalid date format' }, { status: 400 });
			}
		} else {
			// Default to current month
			const now = new Date();
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		}

		// Query invoice taxes for the period
		const { data: invoices, error: invoicesError } = await supabase
			.from('invoices')
			.select(
				`
				id,
				subtotal,
				tax_rate,
				tax_amount,
				total,
				created_at,
				invoice_taxes (
					tax_type_code,
					tax_name,
					rate,
					amount,
					is_exempt
				)
			`
			)
			.eq('user_id', userId)
			.gte('created_at', start.toISOString())
			.lte('created_at', end.toISOString())
			.in('status', ['sent', 'paid']);

		if (invoicesError) {
			throw invoicesError;
		}

		// Calculate summary
		const taxByType: Record<string, TaxSummaryItem> = {};
		let totalTaxCollected = 0;
		let totalTaxableAmount = 0;

		for (const invoice of invoices || []) {
			const invoiceTaxes = invoice.invoice_taxes || [];

			if (invoiceTaxes.length > 0) {
				// Use multi-tax system
				for (const tax of invoiceTaxes) {
					if (!tax.is_exempt) {
						const key = tax.tax_type_code;
						if (!taxByType[key]) {
							taxByType[key] = {
								taxType: tax.tax_type_code,
								taxName: tax.tax_name,
								totalAmount: 0,
								invoiceCount: 0
							};
						}
						taxByType[key].totalAmount += tax.amount || 0;
						taxByType[key].invoiceCount += 1;
						totalTaxCollected += tax.amount || 0;
					}
				}
				totalTaxableAmount += invoice.subtotal || 0;
			} else if (invoice.tax_rate && invoice.tax_amount) {
				// Use legacy single-tax system
				const key = invoice.tax_rate === 13 ? 'HST' : invoice.tax_rate === 5 ? 'GST' : 'CUSTOM';
				if (!taxByType[key]) {
					taxByType[key] = {
						taxType: key,
						taxName: key,
						totalAmount: 0,
						invoiceCount: 0
					};
				}
				taxByType[key].totalAmount += invoice.tax_amount || 0;
				taxByType[key].invoiceCount += 1;
				totalTaxCollected += invoice.tax_amount || 0;
				totalTaxableAmount += invoice.subtotal || 0;
			}
		}

		const report: TaxSummaryReport = {
			period: {
				start: start.toISOString().split('T')[0],
				end: end.toISOString().split('T')[0]
			},
			summary: {
				totalTaxCollected,
				totalInvoices: invoices?.length || 0,
				totalTaxableAmount
			},
			byTaxType: Object.values(taxByType).sort((a, b) => b.totalAmount - a.totalAmount)
		};

		return json({
			success: true,
			data: report
		});
	} catch (error) {
		console.error('Error generating tax summary:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate tax summary'
			},
			{ status: 500 }
		);
	}
};
