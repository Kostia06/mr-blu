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
import type { MeasurementType } from '$lib/parsing/types';

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

	// Area with dimensions: "24 × 90 ft = 2,160 sqft"
	if (item.dimensions && item.measurementType === 'sqft') {
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
