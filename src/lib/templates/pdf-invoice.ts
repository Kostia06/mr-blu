/**
 * PDF Invoice Template
 * Implements PDFTemplate<InvoiceData> for server-side PDF generation via Puppeteer.
 * The html() method produces inline-styled HTML that renders identically to the web preview.
 */

import type { PDFTemplate } from '@kostia06/pdf-gen';
import type { DocumentSourceData } from './types';
import type { MeasurementType } from '$lib/parsing/types';
import {
	formatCurrency as formatCurrencyBase,
	formatDate as formatDateBase,
	formatQuantityDisplay,
	formatRateDisplay
} from '$lib/utils/format';

const formatCurrency = (amount: number) => formatCurrencyBase(amount, true);
const formatDate = (dateStr: string | null | undefined) =>
	dateStr ? formatDateBase(dateStr, 'long') : '';

export interface InvoiceData {
	documentNumber: string;
	businessName: string;
	businessEmail?: string;
	businessPhone?: string;
	businessAddress?: string;
	businessWebsite?: string;
	clientName: string;
	clientEmail?: string;
	clientPhone?: string;
	clientAddress?: string;
	documentDate: string;
	dueDate?: string | null;
	paymentTerms?: string | null;
	items: Array<{
		description: string;
		quantity: number;
		unit: string;
		rate: number;
		total: number;
		measurementType?: string;
		dimensions?: string;
	}>;
	taxRate: number;
	taxAmount: number;
	subtotal: number;
	total: number;
	amountDue?: number | null;
	notes?: string | null;
}

function escapeHtml(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export const invoiceTemplate: PDFTemplate<InvoiceData> = {
	id: 'invoice',
	name: 'Invoice',
	config: {
		pageSize: 'letter',
		orientation: 'portrait'
	},

	render: () => {
		// Not used — mrblu uses @cloudflare/puppeteer with html() instead
	},

	html: (data) => {
		const amountDue = data.amountDue ?? data.total;

		const itemRows = data.items
			.map((item) => {
				const qtyDisplay = formatQuantityDisplay({
					quantity: item.quantity,
					measurementType: item.measurementType as MeasurementType | undefined,
					dimensions: item.dimensions
				});
				const rateDisplay = formatRateDisplay({
					rate: item.rate,
					measurementType: item.measurementType as MeasurementType | undefined
				});

				return `
				<tr style="border-bottom: 1px solid #f3f4f6;">
					<td style="padding: 14px 0; font-size: 11px; font-weight: 600;">${escapeHtml(item.description)}</td>
					<td style="text-align: right; padding: 14px 0; font-size: 11px; font-family: monospace; color: #6b7280;">${escapeHtml(qtyDisplay)}</td>
					<td style="text-align: right; padding: 14px 0; font-size: 11px; font-family: monospace; color: #6b7280;">${escapeHtml(rateDisplay)}</td>
					<td style="text-align: right; padding: 14px 0; font-size: 11px; font-family: monospace; font-weight: 700;">${formatCurrency(item.total)}</td>
				</tr>`;
			})
			.join('');

		return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
</style>
</head>
<body>
<div style="padding: 48px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
	<h1 style="font-size: 32px; font-weight: 700; color: #0066FF; margin: 0 0 4px;">INVOICE</h1>
	<p style="color: #6b7280; font-family: monospace; font-size: 12px;">${escapeHtml(data.documentNumber)}</p>

	<div style="display: flex; justify-content: space-between; margin: 32px 0;">
		<div>
			<p style="font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">From</p>
			<p style="font-weight: 700; font-size: 14px;">${escapeHtml(data.businessName)}</p>
			${data.businessEmail ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.businessEmail)}</p>` : ''}
			${data.businessPhone ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.businessPhone)}</p>` : ''}
			${data.businessAddress ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.businessAddress)}</p>` : ''}
			${data.businessWebsite ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.businessWebsite)}</p>` : ''}
		</div>
		<div>
			<p style="font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">Bill To</p>
			<p style="font-weight: 700; font-size: 14px;">${escapeHtml(data.clientName)}</p>
			${data.clientEmail ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.clientEmail)}</p>` : ''}
			${data.clientPhone ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.clientPhone)}</p>` : ''}
			${data.clientAddress ? `<p style="font-size: 11px; color: #1a1a1a;">${escapeHtml(data.clientAddress)}</p>` : ''}
		</div>
	</div>

	<div style="display: flex; gap: 150px; padding: 14px 24px; background: #f5f5f5; border-radius: 6px; margin-bottom: 32px;">
		<div>
			<span style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Invoice Date</span><br>
			<span style="font-size: 11px; font-weight: 600;">${formatDate(data.documentDate)}</span>
		</div>
		${data.dueDate ? `<div>
			<span style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Due Date</span><br>
			<span style="font-size: 11px; font-weight: 600;">${formatDate(data.dueDate)}</span>
		</div>` : ''}
		${data.paymentTerms ? `<div>
			<span style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Payment Terms</span><br>
			<span style="font-size: 11px; font-weight: 600;">${escapeHtml(data.paymentTerms)}</span>
		</div>` : ''}
	</div>

	<table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
		<thead>
			<tr style="border-bottom: 2px solid #e5e7eb;">
				<th style="text-align: left; padding: 10px 0; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Description</th>
				<th style="text-align: right; padding: 10px 0; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Qty</th>
				<th style="text-align: right; padding: 10px 0; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Rate</th>
				<th style="text-align: right; padding: 10px 0; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Amount</th>
			</tr>
		</thead>
		<tbody>
			${itemRows}
		</tbody>
	</table>

	<div style="width: 220px; margin-left: auto;">
		<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px;">
			<span style="color: #6b7280;">Subtotal</span>
			<span style="font-family: monospace;">${formatCurrency(data.subtotal)}</span>
		</div>
		${data.taxRate > 0 ? `
		<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px;">
			<span style="color: #6b7280;">Tax (${data.taxRate}%)</span>
			<span style="font-family: monospace;">${formatCurrency(data.taxAmount)}</span>
		</div>` : ''}
		<div style="display: flex; justify-content: space-between; padding-top: 10px; margin-top: 8px; border-top: 2px solid #1a1a1a;">
			<span style="font-size: 14px; font-weight: 700;">Total</span>
			<span style="font-size: 20px; font-weight: 700; font-family: monospace;">${formatCurrency(data.total)}</span>
		</div>
	</div>

	<div style="background: #0066FF; color: white; padding: 18px 24px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
		<span style="font-size: 12px; font-weight: 500;">Amount Due</span>
		<span style="font-size: 24px; font-weight: 700; font-family: monospace;">${formatCurrency(amountDue)}</span>
	</div>

	${data.notes ? `
	<div style="margin-top: 32px;">
		<p style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px;">Notes</p>
		<p style="font-size: 10px; color: #6b7280; line-height: 1.5;">${escapeHtml(data.notes)}</p>
	</div>` : ''}

	<div style="text-align: center; margin-top: auto; padding-top: 16px; font-size: 11px; color: #0066FF;">
		Powered by mrblu
	</div>
</div>
</body>
</html>`;
	}
};

export function mapSourceToInvoice(source: DocumentSourceData): InvoiceData {
	return {
		documentNumber: source.documentNumber || '#DRAFT',
		businessName: source.from.businessName || source.from.name || '',
		businessEmail: source.from.email || undefined,
		businessPhone: source.from.phone || undefined,
		businessAddress: source.from.address || undefined,
		businessWebsite: source.from.website || undefined,
		clientName: source.client.name,
		clientEmail: source.client.email || undefined,
		clientPhone: source.client.phone || undefined,
		clientAddress: source.client.address || undefined,
		documentDate: source.date,
		dueDate: source.dueDate,
		paymentTerms: source.paymentTerms,
		items: source.lineItems.map((item) => ({
			description: item.description,
			quantity: item.quantity ?? 1,
			unit: item.unit,
			rate: item.rate ?? 0,
			total: item.total,
			measurementType: item.measurementType,
			dimensions: item.dimensions
		})),
		taxRate: source.taxRate,
		taxAmount: source.taxAmount,
		subtotal: source.subtotal,
		total: source.total,
		amountDue: source.amountDue ?? source.total,
		notes: source.notes
	};
}
