import type { MeasurementType } from '$lib/parsing/types';

// =============================================
// RECURRING INVOICES
// =============================================

export type RecurringFrequency =
	| 'weekly'
	| 'bi-weekly'
	| 'monthly'
	| 'quarterly'
	| 'yearly'
	| 'custom';
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface RecurringLineItem {
	id: string;
	description: string;
	quantity: number;
	unit: string;
	rate: number;
	total: number;
	measurementType?: MeasurementType;
	dimensions?: string;
}

export interface RecurringInvoice {
	id: string;
	user_id: string;
	client_id: string | null;

	// Template
	title: string;
	description: string | null;
	line_items: RecurringLineItem[];
	subtotal: number;
	tax_rate: number;
	tax_amount: number;
	total: number;
	notes: string | null;

	// Frequency
	frequency: RecurringFrequency;
	day_of_week: number | null; // 0-6, Sunday = 0
	day_of_month: number | null; // 1-31
	custom_days: number | null;

	// Schedule
	start_date: string;
	next_send_date: string;
	end_date: string | null;
	max_occurrences: number | null;

	// Delivery
	auto_send: boolean;
	require_confirmation: boolean;
	reminder_days: number;

	// Stats
	occurrences_sent: number;
	total_amount_sent: number;

	// Status
	status: RecurringStatus;
	paused_at: string | null;
	cancelled_at: string | null;

	created_at: string;
	updated_at: string;

	// Joined data
	client?: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
	};
}

export interface RecurringInvoiceHistory {
	id: string;
	recurring_invoice_id: string;
	invoice_id: string;
	occurrence_number: number;
	scheduled_date: string;
	sent_at: string | null;
	created_at: string;

	// Joined data
	invoice?: {
		id: string;
		invoice_number: string;
		total: number;
		status: string;
	};
}

// Form data for creating/editing recurring invoices
export interface RecurringInvoiceFormData {
	client_id: string | null;
	title: string;
	description: string;
	line_items: RecurringLineItem[];
	tax_rate: number;
	notes: string;
	frequency: RecurringFrequency;
	day_of_week: number | null;
	day_of_month: number | null;
	custom_days: number | null;
	start_date: string;
	end_date: string | null;
	max_occurrences: number | null;
	auto_send: boolean;
	require_confirmation: boolean;
	reminder_days: number;
}

// =============================================
// STATISTICS
// =============================================

export type StatisticsPeriod = 'this_month' | 'last_month' | 'this_year' | 'all_time';

export interface MonthlyBreakdown {
	month: string;
	amount: number;
	count: number;
}

export interface TopClient {
	id: string;
	name: string;
	total_amount: number;
	invoice_count: number;
}

export interface InvoiceStatistics {
	period: StatisticsPeriod;
	startDate: string;
	endDate: string;

	// Current period
	totalEarned: number;
	totalPending: number;
	totalOverdue: number;
	invoiceCount: number;
	paidCount: number;

	// Previous period (for comparison)
	prevTotalEarned: number | null;

	// Metrics
	paymentRate: number;
	avgDaysToPayment: number;

	// Breakdowns
	monthlyBreakdown: MonthlyBreakdown[] | null;
	topClients: TopClient[] | null;

	// Projected
	projectedRecurring: number;
}

// Helper to calculate trend percentage
export function calculateTrend(current: number, previous: number | null): number | null {
	if (previous === null || previous === 0) return null;
	return Math.round(((current - previous) / previous) * 100);
}

// Helper to format frequency for display
export function formatFrequency(frequency: RecurringFrequency, customDays?: number | null): string {
	switch (frequency) {
		case 'weekly':
			return 'Weekly';
		case 'bi-weekly':
			return 'Every 2 weeks';
		case 'monthly':
			return 'Monthly';
		case 'quarterly':
			return 'Quarterly';
		case 'yearly':
			return 'Yearly';
		case 'custom':
			return customDays ? `Every ${customDays} days` : 'Custom';
	}
}

// Helper to get next send date display
export function formatNextSendDate(dateStr: string): string {
	const date = new Date(dateStr);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Tomorrow';
	if (diffDays < 7) return `In ${diffDays} days`;

	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
