import { describe, it, expect } from 'vitest';
import {
	formatCurrency,
	formatDate,
	formatDuration,
	formatPhoneNumber,
	truncate,
	formatNumber,
	formatQuantityDisplay,
	formatRateDisplay
} from './format';

describe('formatCurrency', () => {
	it('should format positive amounts', () => {
		expect(formatCurrency(100)).toBe('$100.00');
		expect(formatCurrency(1234.56)).toBe('$1,234.56');
		expect(formatCurrency(1000000)).toBe('$1,000,000.00');
	});

	it('should format zero', () => {
		expect(formatCurrency(0)).toBe('$0.00');
	});

	it('should format negative amounts', () => {
		expect(formatCurrency(-50)).toBe('-$50.00');
	});

	it('should handle decimal precision', () => {
		expect(formatCurrency(10.5)).toBe('$10.50');
		expect(formatCurrency(10.999)).toBe('$11.00');
	});

	it('should format with precise option', () => {
		expect(formatCurrency(100, true)).toBe('$100.00');
		expect(formatCurrency(100.1, true)).toBe('$100.10');
	});
});

describe('formatDate', () => {
	it('should format date string in short format', () => {
		const result = formatDate('2024-01-15T12:00:00', 'short');
		expect(result).toMatch(/Jan.*1[45].*2024/); // Allow for timezone variance
	});

	it('should format date string in long format', () => {
		const result = formatDate('2024-01-15T12:00:00', 'long');
		expect(result).toMatch(/January.*1[45].*2024/); // Allow for timezone variance
	});

	it('should format Date object', () => {
		const date = new Date(2024, 5, 20); // June 20, 2024 (month is 0-indexed)
		const result = formatDate(date, 'short');
		expect(result).toMatch(/Jun.*20.*2024/);
	});

	it('should return empty string for null', () => {
		expect(formatDate(null)).toBe('');
	});

	it('should use short format by default', () => {
		const date = new Date(2024, 11, 25); // December 25, 2024
		const result = formatDate(date);
		expect(result).toMatch(/Dec.*25.*2024/);
	});
});

describe('formatDuration', () => {
	it('should format seconds to MM:SS', () => {
		expect(formatDuration(0)).toBe('00:00');
		expect(formatDuration(30)).toBe('00:30');
		expect(formatDuration(60)).toBe('01:00');
		expect(formatDuration(90)).toBe('01:30');
		expect(formatDuration(125)).toBe('02:05');
	});

	it('should handle large durations', () => {
		expect(formatDuration(3600)).toBe('60:00');
		expect(formatDuration(3661)).toBe('61:01');
	});
});

describe('formatPhoneNumber', () => {
	it('should format 10-digit phone numbers', () => {
		expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
		expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
	});

	it('should handle already formatted numbers', () => {
		expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
	});

	it('should return original for non-10-digit numbers', () => {
		expect(formatPhoneNumber('123')).toBe('123');
		expect(formatPhoneNumber('12345678901')).toBe('12345678901');
	});

	it('should strip non-digit characters before formatting', () => {
		expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
		expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
	});
});

describe('truncate', () => {
	it('should not truncate short strings', () => {
		expect(truncate('Hello', 10)).toBe('Hello');
		expect(truncate('Test', 4)).toBe('Test');
	});

	it('should truncate long strings with ellipsis', () => {
		expect(truncate('Hello World', 8)).toBe('Hello...');
		expect(truncate('This is a long string', 10)).toBe('This is...');
	});

	it('should handle exact length', () => {
		expect(truncate('Hello', 5)).toBe('Hello');
	});

	it('should handle empty strings', () => {
		expect(truncate('', 10)).toBe('');
	});
});

describe('formatNumber', () => {
	it('should format numbers with commas', () => {
		expect(formatNumber(1000)).toBe('1,000');
		expect(formatNumber(1234567)).toBe('1,234,567');
		expect(formatNumber(100)).toBe('100');
	});

	it('should return "0" for null or undefined', () => {
		expect(formatNumber(null)).toBe('0');
		expect(formatNumber(undefined)).toBe('0');
	});

	it('should handle zero', () => {
		expect(formatNumber(0)).toBe('0');
	});

	it('should handle decimals', () => {
		const result = formatNumber(1234.56);
		expect(result).toBe('1,234.56');
	});
});

describe('formatQuantityDisplay', () => {
	it('should return em dash for service items', () => {
		expect(formatQuantityDisplay({ measurementType: 'service' })).toBe('\u2014');
		expect(formatQuantityDisplay({ measurementType: 'job' })).toBe('\u2014');
	});

	it('should format sqft with dimensions', () => {
		const result = formatQuantityDisplay({
			quantity: 2160,
			measurementType: 'sqft',
			dimensions: '24 × 90 ft'
		});
		expect(result).toBe('24 × 90 ft = 2,160 sqft');
	});

	it('should format sqft without dimensions', () => {
		const result = formatQuantityDisplay({
			quantity: 500,
			measurementType: 'sqft'
		});
		expect(result).toBe('500 sqft');
	});

	it('should format linear feet', () => {
		const result = formatQuantityDisplay({
			quantity: 120,
			measurementType: 'linear_ft'
		});
		expect(result).toBe('120 linear ft');
	});

	it('should format hours with correct pluralization', () => {
		expect(formatQuantityDisplay({ quantity: 1, measurementType: 'hour' })).toBe('1 hour');
		expect(formatQuantityDisplay({ quantity: 5, measurementType: 'hour' })).toBe('5 hours');
	});

	it('should return formatted number for default/unit', () => {
		expect(formatQuantityDisplay({ quantity: 10, measurementType: 'unit' })).toBe('10');
		expect(formatQuantityDisplay({ quantity: 1000 })).toBe('1,000');
	});

	it('should handle null/undefined quantity', () => {
		expect(formatQuantityDisplay({})).toBe('0');
		expect(formatQuantityDisplay({ quantity: null })).toBe('0');
	});
});

describe('formatRateDisplay', () => {
	it('should return em dash for service items', () => {
		expect(formatRateDisplay({ measurementType: 'service' })).toBe('\u2014');
		expect(formatRateDisplay({ measurementType: 'job' })).toBe('\u2014');
	});

	it('should format rate with unit suffix', () => {
		expect(formatRateDisplay({ rate: 5, measurementType: 'sqft' })).toBe('$5.00/sqft');
		expect(formatRateDisplay({ rate: 10, measurementType: 'linear_ft' })).toBe('$10.00/ft');
		expect(formatRateDisplay({ rate: 50, measurementType: 'hour' })).toBe('$50.00/hr');
		expect(formatRateDisplay({ rate: 25, measurementType: 'unit' })).toBe('$25.00');
	});

	it('should handle null/undefined rate', () => {
		expect(formatRateDisplay({ measurementType: 'unit' })).toBe('$0.00');
		expect(formatRateDisplay({ rate: null, measurementType: 'sqft' })).toBe('$0.00/sqft');
	});

	it('should use no suffix as default', () => {
		expect(formatRateDisplay({ rate: 100 })).toBe('$100.00');
	});
});
