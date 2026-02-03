import { describe, it, expect } from 'vitest';
import {
	validateTemplateData,
	validateForSending,
	getMissingRequiredFields,
	canGenerate,
	canSend
} from './validation';
import type { TemplateData } from './types';

// Helper to create minimal valid template data
function createValidTemplateData(): TemplateData {
	return {
		documentType: 'INVOICE',
		documentNumber: 'INV-001',
		billTo: {
			name: 'John Doe',
			address: '123 Main St',
			city: 'Austin',
			phone: '555-123-4567',
			email: 'john@example.com'
		},
		from: {
			name: 'Jane Smith',
			businessName: "Smith's Services",
			address: '456 Business Ave',
			city: 'Austin',
			phone: '555-987-6543',
			email: 'jane@smithservices.com'
		},
		items: [
			{
				id: 'item-1',
				description: 'Service provided',
				quantity: 1,
				unit: 'hour',
				rate: 100,
				total: 100
			}
		],
		subtotal: 100,
		gstRate: 0.1,
		gstAmount: 10,
		total: 110,
		date: '2024-01-15',
		dueDate: '2024-02-15'
	};
}

describe('validateTemplateData', () => {
	it('should pass validation for complete valid data', () => {
		const data = createValidTemplateData();
		const result = validateTemplateData(data);

		expect(result.success).toBe(true);
		expect(Object.keys(result.errors)).toHaveLength(0);
	});

	it('should fail without document type', () => {
		const data = createValidTemplateData();
		delete (data as Partial<TemplateData>).documentType;

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors.documentType).toBeDefined();
	});

	it('should fail without document number', () => {
		const data = createValidTemplateData();
		data.documentNumber = '';

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors.documentNumber).toBeDefined();
	});

	it('should fail without client name', () => {
		const data = createValidTemplateData();
		data.billTo.name = '';

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors['billTo.name']).toBeDefined();
	});

	it('should fail without business name', () => {
		const data = createValidTemplateData();
		data.from.businessName = '';

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors['from.businessName']).toBeDefined();
	});

	it('should fail without line items', () => {
		const data = createValidTemplateData();
		data.items = [];

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors.items).toBeDefined();
	});

	it('should fail for item without description', () => {
		const data = createValidTemplateData();
		data.items[0].description = '';

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors['items.0.description']).toBeDefined();
	});

	it('should fail for item with zero or negative total', () => {
		const data = createValidTemplateData();
		data.items[0].total = 0;

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors['items.0.total']).toBeDefined();
	});

	it('should warn if email is missing but not fail', () => {
		const data = createValidTemplateData();
		data.billTo.email = null;

		const result = validateTemplateData(data);

		expect(result.success).toBe(true);
		expect(result.warnings['billTo.email']).toBeDefined();
	});

	it('should fail for invalid email format', () => {
		const data = createValidTemplateData();
		data.billTo.email = 'not-an-email';

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors['billTo.email']).toBeDefined();
	});

	it('should warn for large totals', () => {
		const data = createValidTemplateData();
		data.total = 100000;

		const result = validateTemplateData(data);

		expect(result.warnings.total).toBeDefined();
	});

	it('should warn for invalid phone format', () => {
		const data = createValidTemplateData();
		data.billTo.phone = 'abc';

		const result = validateTemplateData(data);

		expect(result.warnings['billTo.phone']).toBeDefined();
	});

	it('should fail for GST rate out of range', () => {
		const data = createValidTemplateData();
		data.gstRate = 0.5; // 50% - too high

		const result = validateTemplateData(data);

		expect(result.success).toBe(false);
		expect(result.errors.gstRate).toBeDefined();
	});

	it('should allow GST rate of 0', () => {
		const data = createValidTemplateData();
		data.gstRate = 0;

		const result = validateTemplateData(data);

		expect(result.errors.gstRate).toBeUndefined();
	});
});

describe('validateForSending', () => {
	it('should require email for sending', () => {
		const data = createValidTemplateData();
		data.billTo.email = null;

		const result = validateForSending(data);

		expect(result.success).toBe(false);
		expect(result.errors['billTo.email']).toBe('Email is required to send document');
	});

	it('should pass with valid email', () => {
		const data = createValidTemplateData();

		const result = validateForSending(data);

		expect(result.success).toBe(true);
	});
});

describe('getMissingRequiredFields', () => {
	it('should return empty array for complete data', () => {
		const data = createValidTemplateData();

		const missing = getMissingRequiredFields(data);

		expect(missing).toHaveLength(0);
	});

	it('should detect missing client name', () => {
		const data = createValidTemplateData();
		data.billTo.name = '';

		const missing = getMissingRequiredFields(data);

		expect(missing).toContain('Client name');
	});

	it('should detect missing business name', () => {
		const data = createValidTemplateData();
		data.from.businessName = '';

		const missing = getMissingRequiredFields(data);

		expect(missing).toContain('Business name');
	});

	it('should detect missing line items', () => {
		const data = createValidTemplateData();
		data.items = [];

		const missing = getMissingRequiredFields(data);

		expect(missing).toContain('Line items');
	});

	it('should detect missing document number', () => {
		const data = createValidTemplateData();
		data.documentNumber = '';

		const missing = getMissingRequiredFields(data);

		expect(missing).toContain('Document number');
	});

	it('should return multiple missing fields', () => {
		const data: Partial<TemplateData> = {
			documentType: 'INVOICE'
		};

		const missing = getMissingRequiredFields(data);

		expect(missing.length).toBeGreaterThan(1);
	});
});

describe('canGenerate', () => {
	it('should return true for complete valid data', () => {
		const data = createValidTemplateData();

		expect(canGenerate(data)).toBe(true);
	});

	it('should return false without document type', () => {
		const data = createValidTemplateData();
		delete (data as Partial<TemplateData>).documentType;

		expect(canGenerate(data)).toBe(false);
	});

	it('should return false without items', () => {
		const data = createValidTemplateData();
		data.items = [];

		expect(canGenerate(data)).toBe(false);
	});

	it('should return false if item has no description', () => {
		const data = createValidTemplateData();
		data.items[0].description = '';

		expect(canGenerate(data)).toBe(false);
	});

	it('should return false if item has zero total', () => {
		const data = createValidTemplateData();
		data.items[0].total = 0;

		expect(canGenerate(data)).toBe(false);
	});
});

describe('canSend', () => {
	it('should return true for sendable data', () => {
		const data = createValidTemplateData();

		expect(canSend(data)).toBe(true);
	});

	it('should return false without email', () => {
		const data = createValidTemplateData();
		data.billTo.email = null;

		expect(canSend(data)).toBe(false);
	});

	it('should return false with invalid email', () => {
		const data = createValidTemplateData();
		data.billTo.email = 'not-valid';

		expect(canSend(data)).toBe(false);
	});

	it('should return false if cannot generate', () => {
		const data = createValidTemplateData();
		data.items = [];

		expect(canSend(data)).toBe(false);
	});
});
