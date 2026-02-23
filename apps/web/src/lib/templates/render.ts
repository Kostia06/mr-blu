/**
 * Template Rendering Engine
 * Loads and interpolates the document HTML template
 */

import type {
	DocumentSourceData,
	RenderedTemplateData,
	TemplateLineItem,
	RenderOptions
} from './types';
import {
	formatCurrency as formatCurrencyBase,
	formatDate as formatDateBase,
	formatQuantityDisplay as formatQtyDisplay
} from '@/lib/utils/format';
import templateHtml from './document-template.html?raw';

// Format helpers
const formatCurrency = (amount: number) => formatCurrencyBase(amount, true);
const formatDate = (dateStr: string | null | undefined) =>
	dateStr ? formatDateBase(dateStr, 'long') : '';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string | null | undefined): string {
	if (!text) return '';
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Get the raw HTML template
 * Uses Vite's ?raw import to inline the template at build time
 */
export function getTemplate(): string {
	return templateHtml;
}

/**
 * Prepare template data from document source data
 * Transforms raw database/form data into pre-formatted template values
 */
export function prepareTemplateData(
	doc: DocumentSourceData,
	options: RenderOptions = {}
): RenderedTemplateData {
	const { forPdf = false } = options;

	// Format line items
	const lineItems: TemplateLineItem[] = doc.lineItems.map((item) => {
		const detailsDisplay = formatQtyDisplay({
			quantity: item.quantity,
			measurementType: item.measurementType,
			dimensions: item.dimensions
		});

		// Build mobile subtext with details info
		// Skip for simple qty=1 unit items and service/job items
		const qty = item.quantity ?? 1;
		const unit = item.unit || 'unit';
		const mt = item.measurementType;
		const isSimple = qty === 1 && (!mt || mt === 'unit') && unit === 'unit';
		const isServiceJob = mt === 'service' || mt === 'job';
		const detailsSubtext = !isSimple && !isServiceJob ? detailsDisplay : '';

		return {
			description: item.description,
			detailsDisplay,
			totalFormatted: formatCurrency(item.total),
			detailsSubtext
		};
	});

	// Determine if business name should be shown (only if different from name)
	const showBusinessName = Boolean(
		doc.from.businessName && doc.from.businessName !== doc.from.name
	);

	const docTypeUpper = doc.documentType.toUpperCase();
	const isInvoice = docTypeUpper === 'INVOICE';
	return {
		// Document info
		documentType: docTypeUpper,
		documentNumber: doc.documentNumber || '#DRAFT',
		date: formatDate(doc.date),
		dueDate: formatDate(doc.dueDate),
		hasDueDate: Boolean(doc.dueDate),
		isInvoice,
		dateLabel: isInvoice ? 'Invoice Date' : 'Estimate Date',
		dueDateLabel: isInvoice ? 'Due Date' : 'Valid Until',

		// From (sender)
		hasFrom: Boolean(doc.from.name || doc.from.businessName),
		fromName: doc.from.name || '',
		fromBusinessName: doc.from.businessName || '',
		showBusinessName,
		fromAddress: doc.from.address || '',
		fromEmail: doc.from.email || '',
		fromPhone: doc.from.phone || '',
		fromWebsite: doc.from.website || '',

		// Bill To (recipient)
		clientName: doc.client.name || 'Unknown Client',
		clientAddress: doc.client.address || '',
		clientEmail: doc.client.email || '',
		clientPhone: doc.client.phone || '',

		// Line items
		lineItems,

		// Totals
		subtotalFormatted: formatCurrency(doc.subtotal),
		hasTax: doc.taxRate > 0,
		taxLabel: `Tax (${doc.taxRate}%)`,
		taxFormatted: formatCurrency(doc.taxAmount),
		totalFormatted: formatCurrency(doc.total),

		// Payment terms
		hasPaymentTerms: Boolean(doc.paymentTerms),
		paymentTerms: doc.paymentTerms || '',

		// Notes & Terms
		hasNotes: Boolean(doc.notes),
		notes: doc.notes || '',
		hasTerms: Boolean(doc.terms),
		terms: doc.terms || '',

		// Rendering options
		forPdf
	};
}

/**
 * Render template with data
 * Supports simple variable replacement {{var}} and conditional sections {{#condition}}...{{/condition}}
 */
export function renderTemplate(template: string, data: RenderedTemplateData): string {
	let html = template;

	// Handle array sections first: {{#arrayName}}...{{/arrayName}}
	// This iterates over arrays and renders the content for each item
	html = html.replace(/\{\{#lineItems\}\}([\s\S]*?)\{\{\/lineItems\}\}/g, (_, content) => {
		return data.lineItems
			.map((item) => {
				let itemHtml = content;
				// Handle detailsSubtext conditional section
				itemHtml = itemHtml.replace(
					/\{\{#detailsSubtext\}\}([\s\S]*?)\{\{\/detailsSubtext\}\}/g,
					(_: string, inner: string) => (item.detailsSubtext ? inner : '')
				);
				// Replace item-level variables
				itemHtml = itemHtml.replace(/\{\{description\}\}/g, escapeHtml(item.description));
				itemHtml = itemHtml.replace(/\{\{totalFormatted\}\}/g, escapeHtml(item.totalFormatted));
				itemHtml = itemHtml.replace(/\{\{detailsSubtext\}\}/g, escapeHtml(item.detailsSubtext));
				return itemHtml;
			})
			.join('');
	});

	// Handle conditional sections: {{#condition}}...{{/condition}}
	// These are shown only if the condition is truthy
	const conditionalKeys: (keyof RenderedTemplateData)[] = [
		'hasDueDate',
		'hasFrom',
		'hasTax',
		'forPdf',
		'showBusinessName',
		'fromName',
		'fromBusinessName',
		'fromAddress',
		'fromEmail',
		'fromPhone',
		'fromWebsite',
		'clientAddress',
		'clientEmail',
		'clientPhone',
		'isInvoice',
		'hasPaymentTerms',
		'hasNotes',
		'hasTerms'
	];

	for (const key of conditionalKeys) {
		const regex = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, 'g');
		html = html.replace(regex, (_, content) => {
			const value = data[key];
			// For boolean keys, check truthiness; for string keys, check if non-empty
			if (typeof value === 'boolean') {
				return value ? content : '';
			}
			return value ? content : '';
		});
	}

	// Handle simple variable replacement: {{varName}}
	const simpleKeys: (keyof RenderedTemplateData)[] = [
		'documentType',
		'documentNumber',
		'date',
		'dueDate',
		'dateLabel',
		'dueDateLabel',
		'fromName',
		'fromBusinessName',
		'fromAddress',
		'fromEmail',
		'fromPhone',
		'fromWebsite',
		'clientName',
		'clientAddress',
		'clientEmail',
		'clientPhone',
		'subtotalFormatted',
		'taxLabel',
		'taxFormatted',
		'totalFormatted',
		'paymentTerms',
		'notes',
		'terms'
	];

	for (const key of simpleKeys) {
		const value = data[key];
		if (typeof value === 'string') {
			const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
			html = html.replace(regex, escapeHtml(value));
		}
	}

	return html;
}

/**
 * Render complete document HTML from source data
 * Main entry point for document rendering
 */
export function renderDocumentHTML(doc: DocumentSourceData, options: RenderOptions = {}): string {
	const template = getTemplate();
	const data = prepareTemplateData(doc, options);
	return renderTemplate(template, data);
}

/**
 * Extract just the document body (without DOCTYPE, html, head, body tags)
 * Useful for embedding in web pages via {@html}
 */
export function renderDocumentBody(doc: DocumentSourceData, options: RenderOptions = {}): string {
	const fullHtml = renderDocumentHTML(doc, options);

	// Extract content between <body> tags
	const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	if (bodyMatch) {
		return bodyMatch[1].trim();
	}

	// Fallback: return everything
	return fullHtml;
}

/**
 * Get the CSS styles from the template
 * Useful for inlining styles when using the body-only version
 */
export function getTemplateStyles(): string {
	const template = getTemplate();
	const styleMatch = template.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
	return styleMatch ? styleMatch[1] : '';
}
