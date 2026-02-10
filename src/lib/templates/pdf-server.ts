import puppeteer from '@cloudflare/puppeteer';
import type { TemplateData } from '$lib/parsing';
import type { DocumentSourceData } from './types';
import { renderDocumentHTML } from './render';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fetcher = any;

/**
 * Server-side PDF generation using Cloudflare Browser Rendering.
 * Uses the unified document template with forPdf mode,
 * then @cloudflare/puppeteer to convert HTML → PDF.
 */

/**
 * Generate PDF from DocumentSourceData (used by download endpoint)
 */
export async function generatePDFFromSource(
	sourceData: DocumentSourceData,
	browserBinding: Fetcher
): Promise<ArrayBuffer> {
	const html = renderDocumentHTML(sourceData, { forPdf: true });

	const browser = await puppeteer.launch(browserBinding);
	try {
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });
		const pdfBuffer = await page.pdf({
			format: 'Letter',
			printBackground: true
		});
		return pdfBuffer.buffer as ArrayBuffer;
	} finally {
		await browser.close();
	}
}

/**
 * Generate PDF from TemplateData (used by email send endpoint)
 */
export async function generatePDFServer(
	data: TemplateData & { notes?: string | null },
	browserBinding: Fetcher
): Promise<ArrayBuffer> {
	const sourceData: DocumentSourceData = {
		documentType: data.documentType,
		documentNumber: data.documentNumber,
		client: {
			name: data.billTo.name,
			email: data.billTo.email,
			phone: data.billTo.phone,
			address: data.billTo.address
		},
		from: {
			name: data.from.name,
			businessName: data.from.businessName,
			email: data.from.email,
			phone: data.from.phone,
			address: data.from.address,
			website: data.from.website
		},
		lineItems: data.items.map((item) => ({
			description: item.description,
			quantity: item.quantity ?? null,
			unit: item.unit,
			rate: item.rate ?? null,
			total: item.total,
			measurementType: item.measurementType,
			dimensions: item.dimensions
		})),
		subtotal: data.subtotal,
		taxRate: data.gstRate * 100,
		taxAmount: data.gstAmount,
		total: data.total,
		date: data.date,
		dueDate: data.dueDate,
		notes: data.notes ?? null
	};

	return generatePDFFromSource(sourceData, browserBinding);
}
