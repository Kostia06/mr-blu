// Review Dashboard Types
// For the editable review/confirmation screen after AI processes voice commands

import type { MeasurementType, ExtractedData } from '$lib/parsing/types';

// =============================================
// REVIEW STATE
// =============================================

export interface ReviewState {
	// Original AI-generated data
	originalParsedData: ExtractedData | null;

	// Current editable state
	documentType: 'invoice' | 'estimate';

	client: ReviewClient;

	items: EditableLineItem[];

	totals: ReviewTotals;

	actions: ReviewActions;

	// Validation
	validation: ReviewValidation;

	// UI State
	ui: ReviewUIState;
}

export interface ReviewClient {
	id: string | null; // null if new client
	name: string;
	email: string;
	phone: string;
	address: string;
	isNew: boolean;
	saveAsNewClient: boolean;
}

export interface EditableLineItem {
	id: string;
	description: string;
	measurementType: MeasurementType;

	// For sqft/linear_ft - dimensions
	dimensions: {
		width: number;
		length: number;
		unit: 'ft' | 'm';
	} | null;

	// For unit/hour types
	quantity: number | null;

	// Pricing
	pricingMode: 'rate' | 'total';
	rate: number | null;
	total: number;

	// Calculated
	calculatedArea: number | null; // For sqft
	calculatedRate: number | null; // When total is set
}

export interface ReviewTotals {
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	discount: ReviewDiscount | null;
	total: number;
}

export interface ReviewDiscount {
	type: 'percentage' | 'fixed';
	value: number;
	amount: number;
}

export interface ReviewActions {
	createDocument: true; // Always true
	sendEmail: boolean;
	emailRecipients: string[];
	scheduleFor: Date | null;
	setReminder: boolean;
	reminderDays: number;
}

export interface ReviewValidation {
	isValid: boolean;
	errors: ReviewValidationError[];
}

export interface ReviewValidationError {
	field: string;
	message: string;
	section: 'client' | 'items' | 'actions' | 'totals';
}

export interface ReviewUIState {
	expandedSection: string | null;
	isProcessing: boolean;
	showPreview: boolean;
	showClientPicker: boolean;
	showClientEdit: boolean;
	editingItemId: string | null;
	showAddItem: boolean;
	processingStep: 'idle' | 'creating' | 'sending' | 'complete' | 'error';
	successData: ReviewSuccessData | null;
}

export interface ReviewSuccessData {
	documentId: string;
	documentNumber: string;
	documentType: 'invoice' | 'estimate';
	sentTo: string | null;
}

// =============================================
// AI EDIT COMMANDS
// =============================================

export type AIEditCommandType =
	| 'edit_total'
	| 'edit_rate'
	| 'edit_quantity'
	| 'edit_dimensions'
	| 'add_item'
	| 'remove_item'
	| 'edit_item_description'
	| 'change_client'
	| 'edit_client_email'
	| 'edit_client_phone'
	| 'edit_client_name'
	| 'change_document_type'
	| 'add_tax'
	| 'remove_tax'
	| 'toggle_send'
	| 'add_discount'
	| 'remove_discount';

export interface AIEditCommand {
	type: AIEditCommandType;
	payload: Record<string, unknown>;
	description: string;
	beforeValue?: string;
	afterValue?: string;
}

export interface AIEditResponse {
	changes: AIEditCommand[];
	summary: string;
}

// =============================================
// FORM DATA
// =============================================

export interface LineItemFormData {
	description: string;
	measurementType: MeasurementType;
	dimensions: {
		width: number;
		length: number;
		unit: 'ft' | 'm';
	} | null;
	quantity: number | null;
	pricingMode: 'rate' | 'total';
	rate: number | null;
	total: number;
}

export interface ClientFormData {
	name: string;
	email: string;
	phone: string;
	address: string;
	saveToProfile: boolean;
}

// =============================================
// HELPERS
// =============================================

export function createEmptyReviewState(): ReviewState {
	return {
		originalParsedData: null,
		documentType: 'invoice',
		client: {
			id: null,
			name: '',
			email: '',
			phone: '',
			address: '',
			isNew: true,
			saveAsNewClient: false
		},
		items: [],
		totals: {
			subtotal: 0,
			taxRate: 0,
			taxAmount: 0,
			discount: null,
			total: 0
		},
		actions: {
			createDocument: true,
			sendEmail: false,
			emailRecipients: [],
			scheduleFor: null,
			setReminder: false,
			reminderDays: 7
		},
		validation: {
			isValid: false,
			errors: []
		},
		ui: {
			expandedSection: null,
			isProcessing: false,
			showPreview: false,
			showClientPicker: false,
			showClientEdit: false,
			editingItemId: null,
			showAddItem: false,
			processingStep: 'idle',
			successData: null
		}
	};
}

export function createEmptyLineItem(): EditableLineItem {
	return {
		id: crypto.randomUUID(),
		description: '',
		measurementType: 'sqft',
		dimensions: null,
		quantity: null,
		pricingMode: 'total',
		rate: null,
		total: 0,
		calculatedArea: null,
		calculatedRate: null
	};
}

export function calculateLineItemTotal(item: EditableLineItem): number {
	if (item.pricingMode === 'total') {
		return item.total;
	}

	if (item.rate === null) return 0;

	switch (item.measurementType) {
		case 'sqft':
			if (item.dimensions) {
				const area = item.dimensions.width * item.dimensions.length;
				return area * item.rate;
			}
			return 0;

		case 'linear_ft':
			if (item.dimensions) {
				// For linear, typically use length
				return item.dimensions.length * item.rate;
			}
			return 0;

		case 'unit':
		case 'hour':
			if (item.quantity !== null) {
				return item.quantity * item.rate;
			}
			return 0;

		case 'job':
		case 'service':
			return item.rate;

		default:
			return 0;
	}
}

export function calculateArea(item: EditableLineItem): number | null {
	if (item.measurementType !== 'sqft' || !item.dimensions) return null;
	return item.dimensions.width * item.dimensions.length;
}

export function calculateRate(item: EditableLineItem): number | null {
	if (item.pricingMode !== 'total' || item.total === 0) return null;

	switch (item.measurementType) {
		case 'sqft':
			const area = calculateArea(item);
			if (area && area > 0) {
				return item.total / area;
			}
			return null;

		case 'linear_ft':
			if (item.dimensions && item.dimensions.length > 0) {
				return item.total / item.dimensions.length;
			}
			return null;

		case 'unit':
		case 'hour':
			if (item.quantity && item.quantity > 0) {
				return item.total / item.quantity;
			}
			return null;

		default:
			return null;
	}
}

export function calculateTotals(
	items: EditableLineItem[],
	taxRate: number,
	discount: ReviewDiscount | null
): ReviewTotals {
	const subtotal = items.reduce((sum, item) => sum + item.total, 0);

	let discountAmount = 0;
	if (discount) {
		discountAmount =
			discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value;
	}

	const taxableAmount = subtotal - discountAmount;
	const taxAmount = taxableAmount * (taxRate / 100);
	const total = taxableAmount + taxAmount;

	return {
		subtotal,
		taxRate,
		taxAmount,
		discount: discount
			? {
					...discount,
					amount: discountAmount
				}
			: null,
		total
	};
}

export function validateReviewState(state: ReviewState): ReviewValidation {
	const errors: ReviewValidationError[] = [];

	// Client validation
	if (!state.client.name.trim()) {
		errors.push({
			field: 'client.name',
			message: 'Client name is required',
			section: 'client'
		});
	}

	if (state.actions.sendEmail) {
		if (!state.client.email.trim()) {
			errors.push({
				field: 'client.email',
				message: 'Email is required to send',
				section: 'client'
			});
		} else if (!isValidEmail(state.client.email)) {
			errors.push({
				field: 'client.email',
				message: 'Please enter a valid email',
				section: 'client'
			});
		}
	}

	// Items validation
	if (state.items.length === 0) {
		errors.push({
			field: 'items',
			message: 'At least one line item is required',
			section: 'items'
		});
	}

	state.items.forEach((item, index) => {
		if (!item.description.trim()) {
			errors.push({
				field: `items.${index}.description`,
				message: `Item ${index + 1} needs a description`,
				section: 'items'
			});
		}

		if (item.total <= 0) {
			errors.push({
				field: `items.${index}.total`,
				message: `Item ${index + 1} needs a valid amount`,
				section: 'items'
			});
		}
	});

	// Actions validation
	if (
		state.actions.sendEmail &&
		state.actions.emailRecipients.length === 0 &&
		!state.client.email
	) {
		errors.push({
			field: 'actions.emailRecipients',
			message: 'No email recipient specified',
			section: 'actions'
		});
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatMeasurementType(type: MeasurementType): string {
	switch (type) {
		case 'sqft':
			return 'Square Feet';
		case 'linear_ft':
			return 'Linear Feet';
		case 'unit':
			return 'Units';
		case 'hour':
			return 'Hours';
		case 'job':
			return 'Flat Rate';
		case 'service':
			return 'Service';
		default:
			return type;
	}
}

export function formatMeasurementUnit(type: MeasurementType): string {
	switch (type) {
		case 'sqft':
			return 'sqft';
		case 'linear_ft':
			return 'ft';
		case 'unit':
			return 'units';
		case 'hour':
			return 'hrs';
		case 'job':
			return 'job';
		case 'service':
			return 'service';
		default:
			return type;
	}
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2
	}).format(amount);
}
