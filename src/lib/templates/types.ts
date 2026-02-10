/**
 * Unified Template Types
 * Single source of truth for document template data structures
 */

import type { MeasurementType } from '$lib/parsing/types';

/**
 * Raw document data from database
 * Used for preparing template data
 */
export interface DocumentSourceData {
	documentType: string;
	documentNumber?: string;
	client: {
		name: string;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	from: {
		name?: string | null;
		businessName?: string | null;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	lineItems: Array<{
		description: string;
		quantity?: number | null;
		unit: string;
		rate?: number | null;
		total: number;
		measurementType?: MeasurementType;
		dimensions?: string;
	}>;
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	total: number;
	date: string;
	dueDate?: string | null;
	paymentTerms?: string | null;
	notes?: string | null;
	terms?: string | null;
	amountDue?: number | null;
}

/**
 * Pre-formatted line item for template rendering
 */
export interface TemplateLineItem {
	description: string;
	detailsDisplay: string; // Pre-formatted: "24 × 90 ft = 2,160 sqft" or em-dash for service
	totalFormatted: string; // Pre-formatted: "$756.00"
	detailsSubtext: string; // Mobile-only: "156 sqft" (empty for service/simple items)
}

/**
 * Template data with all values pre-formatted for interpolation
 * This is the data structure passed to the HTML template
 */
export interface RenderedTemplateData {
	// Document info
	documentType: string; // "INVOICE", "ESTIMATE"
	documentNumber: string; // "#INV-001"
	date: string; // Formatted: "January 22, 2026"
	dueDate: string; // Formatted or empty string
	hasDueDate: boolean; // For conditional sections
	isInvoice: boolean; // true if documentType is INVOICE
	dateLabel: string; // "Invoice Date" or "Estimate Date"
	dueDateLabel: string; // "Due Date" or "Valid Until"

	// From (sender)
	hasFrom: boolean;
	fromName: string;
	fromBusinessName: string;
	showBusinessName: boolean; // Only show if different from name
	fromAddress: string;
	fromEmail: string;
	fromPhone: string;

	// Bill To (recipient)
	clientName: string;
	clientAddress: string;
	clientEmail: string;
	clientPhone: string;

	// Line items (pre-formatted)
	lineItems: TemplateLineItem[];

	// Totals
	subtotalFormatted: string;
	hasTax: boolean;
	taxLabel: string; // "Tax (8%)"
	taxFormatted: string;
	totalFormatted: string;

	// Amount Due (invoices only)
	hasAmountDue: boolean;
	amountDueFormatted: string;

	// Payment terms
	hasPaymentTerms: boolean;
	paymentTerms: string;

	// Notes & Terms
	hasNotes: boolean;
	notes: string;
	hasTerms: boolean;
	terms: string;

	// Rendering options
	forPdf: boolean;
}

/**
 * Options for template rendering
 */
export interface RenderOptions {
	forPdf?: boolean;
}
