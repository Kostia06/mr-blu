import { describe, it, expect } from 'vitest';
import { prepareTemplateData, renderTemplate, getTemplate } from './render';
import type { DocumentSourceData } from './types';

function makeDoc(overrides: Partial<DocumentSourceData> = {}): DocumentSourceData {
	return {
		documentType: 'invoice',
		documentNumber: 'INV-001',
		client: { name: 'John Doe' },
		from: { name: 'Jane Smith' },
		lineItems: [],
		subtotal: 0,
		taxRate: 0,
		taxAmount: 0,
		total: 0,
		date: '2026-01-15',
		...overrides
	};
}

describe('prepareTemplateData - qtySubtext', () => {
	it('generates qtySubtext for sqft items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Composite deck',
					quantity: 156,
					unit: 'sqft',
					rate: 57,
					total: 8892,
					measurementType: 'sqft'
				}
			],
			subtotal: 8892,
			total: 8892
		});

		const data = prepareTemplateData(doc);
		expect(data.lineItems[0].qtySubtext).toContain('156');
		expect(data.lineItems[0].qtySubtext).toContain('@');
		expect(data.lineItems[0].qtySubtext).toContain('$57.00');
	});

	it('generates qtySubtext for linear_ft items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Baseboard trim',
					quantity: 35,
					unit: 'linear_ft',
					rate: 12,
					total: 420,
					measurementType: 'linear_ft'
				}
			],
			subtotal: 420,
			total: 420
		});

		const data = prepareTemplateData(doc);
		expect(data.lineItems[0].qtySubtext).toContain('35');
		expect(data.lineItems[0].qtySubtext).toContain('@');
	});

	it('skips qtySubtext for simple qty=1 unit items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Service call',
					quantity: 1,
					unit: 'unit',
					rate: 500,
					total: 500,
					measurementType: 'unit'
				}
			],
			subtotal: 500,
			total: 500
		});

		const data = prepareTemplateData(doc);
		expect(data.lineItems[0].qtySubtext).toBe('');
	});

	it('skips qtySubtext for service/job items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Full renovation',
					quantity: 1,
					unit: 'job',
					rate: 5000,
					total: 5000,
					measurementType: 'job'
				}
			],
			subtotal: 5000,
			total: 5000
		});

		const data = prepareTemplateData(doc);
		expect(data.lineItems[0].qtySubtext).toBe('');
	});

	it('generates qtySubtext for multi-quantity unit items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Light fixtures',
					quantity: 5,
					unit: 'ea',
					rate: 120,
					total: 600
				}
			],
			subtotal: 600,
			total: 600
		});

		const data = prepareTemplateData(doc);
		expect(data.lineItems[0].qtySubtext).toContain('5');
		expect(data.lineItems[0].qtySubtext).toContain('@');
		expect(data.lineItems[0].qtySubtext).toContain('$120.00');
	});
});

describe('renderTemplate - qtySubtext in HTML', () => {
	it('renders qtySubtext span when present', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Flooring',
					quantity: 200,
					unit: 'sqft',
					rate: 5,
					total: 1000,
					measurementType: 'sqft'
				}
			],
			subtotal: 1000,
			total: 1000
		});

		const template = getTemplate();
		const data = prepareTemplateData(doc);
		const html = renderTemplate(template, data);

		expect(html).toContain('<span class="qty-subtext">');
		expect(html).toContain('200');
	});

	it('omits qtySubtext span for simple items', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Service',
					quantity: 1,
					unit: 'unit',
					rate: 500,
					total: 500,
					measurementType: 'unit'
				}
			],
			subtotal: 500,
			total: 500
		});

		const template = getTemplate();
		const data = prepareTemplateData(doc);
		const html = renderTemplate(template, data);

		expect(html).not.toContain('<span class="qty-subtext">');
	});
});
