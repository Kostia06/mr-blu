export function formatCurrency(amount: number, precise = false): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		...(precise && { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	}).format(amount);
}

export function formatDate(date: string | Date | null, format: 'short' | 'long' = 'short'): string {
	if (!date) return '';
	const d = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat('en-US', {
		month: format,
		day: 'numeric',
		year: 'numeric'
	}).format(d);
}

export function formatRelativeTime(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

	return formatDate(d, 'short');
}

export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatPhoneNumber(phone: string): string {
	const cleaned = phone.replace(/\D/g, '');
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
	}
	return phone;
}

export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

// Format number with commas (e.g., 2160 -> "2,160")
export function formatNumber(value: number | null | undefined): string {
	if (value === null || value === undefined) return '0';
	return new Intl.NumberFormat('en-US').format(value);
}

// Types for line item formatting
import type { MeasurementType } from '@/lib/parsing/types';

interface LineItemForFormat {
	quantity?: number | null;
	rate?: number | null;
	amount?: number | null;
	measurementType?: MeasurementType;
	dimensions?: string;
}

// Format quantity display based on measurement type
export function formatQuantityDisplay(item: LineItemForFormat): string {
	// Service/job items: return em dash
	if (item.measurementType === 'service' || item.measurementType === 'job') {
		return '\u2014'; // em dash
	}

	const qty = item.quantity ?? 0;

	// Area with dimensions: "24 x 90 ft = 2,160 sqft"
	if (item.dimensions && !item.dimensions.includes('undefined') && item.measurementType === 'sqft') {
		return `${item.dimensions} = ${formatNumber(qty)} sqft`;
	}

	// Linear feet: "120 linear ft"
	if (item.measurementType === 'linear_ft') {
		return `${formatNumber(qty)} linear ft`;
	}

	// Hours: "5 hours" or "1 hour"
	if (item.measurementType === 'hour') {
		return `${formatNumber(qty)} ${qty === 1 ? 'hour' : 'hours'}`;
	}

	// Square feet without dimensions
	if (item.measurementType === 'sqft') {
		return `${formatNumber(qty)} sqft`;
	}

	// Default: just the number
	return formatNumber(qty);
}

// Format rate display based on measurement type
export function formatRateDisplay(item: LineItemForFormat): string {
	// Service/job items: return em dash
	if (item.measurementType === 'service' || item.measurementType === 'job') {
		return '\u2014'; // em dash
	}

	const rate = item.rate ?? 0;

	// Unit labels for each measurement type
	const unitLabels: Record<MeasurementType, string> = {
		sqft: '/sqft',
		linear_ft: '/ft',
		unit: '',
		hour: '/hr',
		job: '',
		service: ''
	};

	const suffix = unitLabels[item.measurementType || 'unit'] || '';
	return `${formatCurrency(rate)}${suffix}`;
}

// Document interface for grouping
interface DocumentForGrouping {
	id: string;
	date: string;
	[key: string]: unknown;
}

// Group documents by month for section headers
export function groupDocumentsByMonth<T extends DocumentForGrouping>(
	documents: T[],
	locale: string = 'en'
): Map<string, T[]> {
	const groups = new Map<string, T[]>();

	// Sort documents by date descending first
	const sorted = [...documents].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	for (const doc of sorted) {
		const date = new Date(doc.date);
		// Format as "MONTH YEAR" in the user's locale
		const monthKey = date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
			month: 'long',
			year: 'numeric'
		});
		const upperKey = monthKey.toUpperCase();

		if (!groups.has(upperKey)) {
			groups.set(upperKey, []);
		}
		groups.get(upperKey)!.push(doc);
	}

	return groups;
}

// Format exact date and time localized (e.g., "Jan 30, 2:30 PM" or "30 ene, 14:30")
export function formatExactDateTime(
	date: string | Date,
	locale: string = 'en'
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const isSpanish = locale === 'es';

	return d.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: !isSpanish
	});
}

// Smart time format: relative for up to 3 days, then exact date/time
export function formatSmartTime(
	date: string | Date,
	locale: string = 'en'
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	const isSpanish = locale === 'es';

	// Less than 1 minute
	if (diffMins < 1) {
		return isSpanish ? 'ahora' : 'now';
	}

	// Less than 1 hour
	if (diffMins < 60) {
		return isSpanish ? `hace ${diffMins}m` : `${diffMins}m ago`;
	}

	// Less than 24 hours
	if (diffHours < 24) {
		return isSpanish ? `hace ${diffHours}h` : `${diffHours}h ago`;
	}

	// Yesterday
	if (diffDays === 1) {
		return isSpanish ? 'ayer' : 'yesterday';
	}

	// 2-3 days ago
	if (diffDays <= 3) {
		return isSpanish ? `hace ${diffDays}d` : `${diffDays}d ago`;
	}

	// Older than 3 days - show exact date and time
	return d.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		hour12: !isSpanish
	});
}

// Localized relative time ("hace 2h", "yesterday", "30 Jan")
export function formatRelativeTimeLocalized(
	date: string | Date,
	locale: string = 'en'
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffMins = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	const isSpanish = locale === 'es';

	// Less than 1 minute
	if (diffMins < 1) {
		return isSpanish ? 'ahora' : 'now';
	}

	// Less than 1 hour
	if (diffMins < 60) {
		return isSpanish ? `hace ${diffMins}m` : `${diffMins}m ago`;
	}

	// Less than 24 hours
	if (diffHours < 24) {
		return isSpanish ? `hace ${diffHours}h` : `${diffHours}h ago`;
	}

	// Yesterday
	if (diffDays === 1) {
		return isSpanish ? 'ayer' : 'yesterday';
	}

	// Less than 7 days
	if (diffDays < 7) {
		return isSpanish ? `hace ${diffDays}d` : `${diffDays}d ago`;
	}

	// Older than 7 days - show short date
	return d.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', {
		day: 'numeric',
		month: 'short'
	});
}
