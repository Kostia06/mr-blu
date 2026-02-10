import { describe, it, expect } from 'vitest';
import { prepareTemplateData, renderTemplate, renderDocumentHTML, getTemplate } from './render';
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

describe('prepareTemplateData - detailsSubtext', () => {
	it('generates detailsSubtext for sqft items', () => {
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
		expect(data.lineItems[0].detailsSubtext).toContain('156');
		expect(data.lineItems[0].detailsSubtext).toContain('sqft');
	});

	it('generates detailsSubtext for linear_ft items', () => {
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
		expect(data.lineItems[0].detailsSubtext).toContain('35');
		expect(data.lineItems[0].detailsSubtext).toContain('linear ft');
	});

	it('skips detailsSubtext for simple qty=1 unit items', () => {
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
		expect(data.lineItems[0].detailsSubtext).toBe('');
	});

	it('skips detailsSubtext for service/job items', () => {
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
		expect(data.lineItems[0].detailsSubtext).toBe('');
	});

	it('generates detailsSubtext for multi-quantity unit items', () => {
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
		expect(data.lineItems[0].detailsSubtext).toContain('5');
	});
});

describe('renderTemplate - detailsSubtext in HTML', () => {
	it('renders detailsSubtext span when present', () => {
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

		expect(html).toContain('<span class="details-subtext">');
		expect(html).toContain('200');
	});

	it('omits detailsSubtext span for simple items', () => {
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

		expect(html).not.toContain('<span class="details-subtext">');
	});
});

describe('renderDocumentHTML - forPdf mode', () => {
	it('adds for-pdf class when forPdf is true', () => {
		const doc = makeDoc({
			lineItems: [
				{
					description: 'Deck install',
					quantity: 100,
					unit: 'sqft',
					rate: 10,
					total: 1000,
					measurementType: 'sqft'
				}
			],
			subtotal: 1000,
			taxRate: 5,
			taxAmount: 50,
			total: 1050
		});

		const html = renderDocumentHTML(doc, { forPdf: true });

		expect(html).toContain('class="document-template for-pdf"');
		expect(html).toContain('INVOICE');
		expect(html).toContain('INV-001');
		expect(html).toContain('Deck install');
		expect(html).toContain('$1,050.00');
	});

	it('does not add for-pdf class to document div when forPdf is false', () => {
		const doc = makeDoc();
		const html = renderDocumentHTML(doc, { forPdf: false });

		expect(html).not.toContain('class="document-template for-pdf"');
	});

	it('renders estimate type correctly in PDF mode', () => {
		const doc = makeDoc({
			documentType: 'estimate',
			documentNumber: 'EST-042',
			lineItems: [
				{
					description: 'Kitchen reno',
					quantity: 1,
					unit: 'job',
					rate: 15000,
					total: 15000,
					measurementType: 'job'
				}
			],
			subtotal: 15000,
			total: 15000
		});

		const html = renderDocumentHTML(doc, { forPdf: true });

		expect(html).toContain('ESTIMATE');
		expect(html).toContain('EST-042');
		expect(html).toContain('Kitchen reno');
		expect(html).toContain('Estimate Date');
	});
});
