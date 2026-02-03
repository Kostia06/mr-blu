import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { StatisticsPeriod } from '$lib/types/recurring';

// GET - Fetch invoice statistics for the user
export const GET: RequestHandler = async ({ url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const period = (url.searchParams.get('period') || 'this_month') as StatisticsPeriod;

	// Validate period
	const validPeriods: StatisticsPeriod[] = ['this_month', 'last_month', 'this_year', 'all_time'];
	if (!validPeriods.includes(period)) {
		return json({ error: 'Invalid period', success: false }, { status: 400 });
	}

	try {
		// Call the database function we created in the migration
		const { data, error } = await supabase.rpc('get_invoice_statistics', {
			p_user_id: userId,
			p_period: period
		});

		if (error) {
			console.error('Get statistics error:', error);
			// Fallback to manual calculation if function doesn't exist yet
			return await calculateStatisticsManually(supabase, userId, period);
		}

		return json(
			{ success: true, statistics: data },
			{
				headers: {
					'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
				}
			}
		);
	} catch (error) {
		console.error('Get statistics error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch statistics',
				success: false
			},
			{ status: 500 }
		);
	}
};

// Fallback manual calculation if database function isn't available
async function calculateStatisticsManually(
	supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
	userId: string,
	period: StatisticsPeriod
) {
	const now = new Date();
	let startDate: Date;
	let endDate: Date;
	let prevStartDate: Date | null = null;
	let prevEndDate: Date | null = null;

	switch (period) {
		case 'this_month':
			startDate = new Date(now.getFullYear(), now.getMonth(), 1);
			endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
			prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
			break;
		case 'last_month':
			startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			endDate = new Date(now.getFullYear(), now.getMonth(), 0);
			prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
			prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
			break;
		case 'this_year':
			startDate = new Date(now.getFullYear(), 0, 1);
			endDate = new Date(now.getFullYear(), 11, 31);
			prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
			prevEndDate = new Date(now.getFullYear() - 1, 11, 31);
			break;
		case 'all_time':
		default:
			startDate = new Date('1970-01-01');
			endDate = new Date(now.getFullYear() + 1, 0, 1);
			break;
	}

	const formatDate = (d: Date) => d.toISOString().split('T')[0];

	try {
		// Get paid invoices (earned)
		const { data: paidInvoices } = await supabase
			.from('invoices')
			.select('total, paid_at, created_at, client_id')
			.eq('user_id', userId)
			.eq('status', 'paid')
			.gte('paid_at', formatDate(startDate))
			.lte('paid_at', formatDate(endDate));

		// Get pending invoices
		const { data: pendingInvoices } = await supabase
			.from('invoices')
			.select('total')
			.eq('user_id', userId)
			.in('status', ['sent', 'pending'])
			.gte('created_at', formatDate(startDate))
			.lte('created_at', formatDate(endDate));

		// Get overdue invoices
		const { data: overdueInvoices } = await supabase
			.from('invoices')
			.select('total')
			.eq('user_id', userId)
			.eq('status', 'overdue');

		// Get all invoices count (excluding drafts)
		const { count: invoiceCount } = await supabase
			.from('invoices')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.neq('status', 'draft')
			.gte('created_at', formatDate(startDate))
			.lte('created_at', formatDate(endDate));

		// Get previous period earned (for comparison)
		let prevTotalEarned: number | null = null;
		if (prevStartDate && prevEndDate) {
			const { data: prevPaid } = await supabase
				.from('invoices')
				.select('total')
				.eq('user_id', userId)
				.eq('status', 'paid')
				.gte('paid_at', formatDate(prevStartDate))
				.lte('paid_at', formatDate(prevEndDate));

			prevTotalEarned = prevPaid?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
		}

		// Calculate totals
		const totalEarned = paidInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
		const totalPending = pendingInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
		const totalOverdue = overdueInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
		const paidCount = paidInvoices?.length || 0;

		// Payment rate
		const paymentRate =
			invoiceCount && invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100 * 10) / 10 : 0;

		// Average days to payment
		let avgDaysToPayment = 0;
		if (paidInvoices && paidInvoices.length > 0) {
			const totalDays = paidInvoices.reduce((sum, inv) => {
				if (inv.paid_at && inv.created_at) {
					const days =
						(new Date(inv.paid_at).getTime() - new Date(inv.created_at).getTime()) /
						(1000 * 60 * 60 * 24);
					return sum + days;
				}
				return sum;
			}, 0);
			avgDaysToPayment = Math.round((totalDays / paidInvoices.length) * 10) / 10;
		}

		// Get monthly breakdown (last 6 months for charts)
		const sixMonthsAgo = new Date(now);
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const { data: monthlyData } = await supabase
			.from('invoices')
			.select('total, paid_at')
			.eq('user_id', userId)
			.eq('status', 'paid')
			.gte('paid_at', formatDate(sixMonthsAgo));

		const monthlyBreakdown = monthlyData
			? Object.values(
					monthlyData.reduce(
						(acc: Record<string, { month: string; amount: number; count: number }>, inv) => {
							const month = inv.paid_at?.substring(0, 7) || '';
							if (!acc[month]) {
								acc[month] = { month, amount: 0, count: 0 };
							}
							acc[month].amount += Number(inv.total);
							acc[month].count += 1;
							return acc;
						},
						{}
					)
				).sort((a, b) => a.month.localeCompare(b.month))
			: [];

		// Get top clients
		const clientTotals: Record<
			string,
			{ id: string; total_amount: number; invoice_count: number }
		> = {};
		if (paidInvoices) {
			for (const inv of paidInvoices) {
				if (inv.client_id) {
					if (!clientTotals[inv.client_id]) {
						clientTotals[inv.client_id] = { id: inv.client_id, total_amount: 0, invoice_count: 0 };
					}
					clientTotals[inv.client_id].total_amount += Number(inv.total);
					clientTotals[inv.client_id].invoice_count += 1;
				}
			}
		}

		const clientIds = Object.keys(clientTotals);
		let topClients: Array<{
			id: string;
			name: string;
			total_amount: number;
			invoice_count: number;
		}> = [];

		if (clientIds.length > 0) {
			const { data: clients } = await supabase
				.from('clients')
				.select('id, name')
				.in('id', clientIds);

			topClients = Object.values(clientTotals)
				.map((c) => ({
					...c,
					name: clients?.find((cl) => cl.id === c.id)?.name || 'Unknown'
				}))
				.sort((a, b) => b.total_amount - a.total_amount)
				.slice(0, 5);
		}

		// Get projected recurring
		const { data: activeRecurring } = await supabase
			.from('recurring_invoices')
			.select('total, next_send_date')
			.eq('user_id', userId)
			.eq('status', 'active')
			.gte('next_send_date', formatDate(now))
			.lte('next_send_date', formatDate(endDate));

		const projectedRecurring = activeRecurring?.reduce((sum, r) => sum + Number(r.total), 0) || 0;

		const statistics = {
			period,
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
			totalEarned,
			totalPending,
			totalOverdue,
			invoiceCount: invoiceCount || 0,
			paidCount,
			prevTotalEarned,
			paymentRate,
			avgDaysToPayment,
			monthlyBreakdown,
			topClients,
			projectedRecurring
		};

		return json(
			{ success: true, statistics },
			{
				headers: {
					'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
				}
			}
		);
	} catch (error) {
		console.error('Manual statistics calculation error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to calculate statistics',
				success: false
			},
			{ status: 500 }
		);
	}
}
