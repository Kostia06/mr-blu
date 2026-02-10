// Document Review Data Types

// Measurement types for line items
export type MeasurementType = 'sqft' | 'linear_ft' | 'unit' | 'hour' | 'job' | 'service';

export interface ExtractedData {
	// Documents to create
	documents: DocumentIntent[];

	// Client information
	client: ClientData;

	// Line items
	items: LineItem[];

	// Financial
	taxRate: number | null;
	discount: number | null;

	// Dates
	date: string;
	dueDate: string | null;

	// Actions
	actions: ActionIntent[];

	// Scheduling
	schedule: ScheduleIntent | null;

	// Raw transcription for reference
	rawTranscription: string;

	// Confidence scores
	confidence: {
		overall: number;
		client: number;
		items: number;
		actions: number;
	};
}

export interface DocumentIntent {
	type: 'invoice' | 'estimate' | 'quote' | 'report';
	action: 'create' | 'send' | 'keep' | 'draft';
	priority: number;
}

export interface ClientData {
	name: string | null;
	email: string | null;
	phone: string | null;
	address: string | null;
}

export interface LineItem {
	id: string;
	description: string;
	quantity: number | null;
	unit: string;
	rate: number | null;
	amount: number | null;
	isEstimate: boolean;
	needsReview: boolean;
	measurementType?: MeasurementType;
	dimensions?: string; // e.g., "24 × 90 ft"
}

export interface ActionIntent {
	action: 'send' | 'save' | 'schedule' | 'remind';
	target: 'client' | 'self' | 'email';
	documentType: string;
	condition: string | null;
}

export interface ScheduleIntent {
	frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
	startDate: string;
	endDate: string | null;
	repeatUntil: string | null;
	occurrences: number | null;
	nextDates: string[];
}

// Template data structure for PDF generation
export interface TemplateData {
	// Header
	documentType: 'INVOICE' | 'ESTIMATE';
	documentNumber: string;

	// Parties
	billTo: {
		name: string;
		address: string | null;
		city: string | null;
		phone: string | null;
		email: string | null;
	};
	from: {
		name: string | null;
		businessName: string;
		address: string | null;
		city: string | null;
		phone: string | null;
		email: string | null;
		website: string | null;
	};

	// Line items
	items: Array<{
		id: string;
		description: string;
		quantity?: number;
		unit: string;
		rate?: number;
		total: number;
		measurementType?: MeasurementType;
		dimensions?: string; // e.g., "24 × 90 ft"
	}>;

	// Summary
	subtotal: number;
	gstRate: number;
	gstAmount: number;
	total: number;

	// Metadata
	date: string;
	dueDate: string | null;
	notes?: string | null;
}

// Validation errors
export interface ValidationErrors {
	[key: string]: string;
}

export interface ValidationResult {
	success: boolean;
	errors: ValidationErrors;
	warnings: ValidationErrors;
}
