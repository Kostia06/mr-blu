// Document Transform Types
// For converting documents between types (estimate <-> invoice)

// =============================================
// TRANSFORM CONFIGURATION
// =============================================

export interface TransformSource {
	clientName: string;
	documentType: 'invoice' | 'estimate' | null;
	selector: 'last' | 'latest' | 'recent' | null;
	documentNumber: string | null;
}

export interface TransformConversion {
	enabled: boolean;
	targetType: 'invoice' | 'estimate';
}

export interface TransformAction {
	type: 'create_document' | 'send_email';
	order: number;
}

export interface TransformConfidence {
	overall: number;
	source: number;
	conversion: number;
}

// =============================================
// PARSED TRANSFORM DATA (from AI)
// =============================================

export interface ParsedTransformData {
	intentType: 'document_transform';
	source: TransformSource;
	conversion: TransformConversion;
	actions: TransformAction[];
	summary: string;
	confidence: TransformConfidence;
}

// =============================================
// TRANSFORM JOB (database record)
// =============================================

export type TransformJobStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type TransformDocStatus = 'created' | 'sent' | 'cancelled';

export interface TransformJobConfig {
	conversion: {
		enabled: boolean;
		targetType: 'invoice' | 'estimate';
	};
}

export interface TransformJob {
	id: string;
	userId: string;

	// Source
	sourceDocumentId: string;
	sourceDocumentType: 'invoice' | 'estimate';
	sourceTotal: number;
	sourceClientId: string;

	// Configuration
	config: TransformJobConfig;

	// Generated document
	generatedDocument: TransformGeneratedDoc | null;

	// Status
	status: TransformJobStatus;

	// Metadata
	createdAt: Date;
	updatedAt: Date;
	completedAt: Date | null;
}

export interface TransformGeneratedDoc {
	id: string;
	transformJobId: string;
	documentId: string;
	documentNumber: string;
	amount: number;
	type: 'invoice' | 'estimate';
	status: TransformDocStatus;
	sentAt: Date | null;
	createdAt: Date;
}

// =============================================
// TRANSFORM REVIEW STATE
// =============================================

export interface TransformReviewState {
	// Source document (loaded from database)
	sourceDocument: {
		id: string;
		type: 'invoice' | 'estimate';
		number: string;
		total: number;
		clientId: string;
		clientName: string;
		clientEmail: string;
		items: Array<{
			id: string;
			description: string;
			quantity: number;
			rate: number;
			total: number;
		}>;
		createdAt: Date;
	} | null;

	// Conversion settings
	conversion: {
		enabled: boolean;
		targetType: 'invoice' | 'estimate';
	};

	// UI state
	ui: {
		isLoading: boolean;
		isProcessing: boolean;
		error: string | null;
	};
}

// =============================================
// HELPERS
// =============================================

export function createEmptyTransformReviewState(): TransformReviewState {
	return {
		sourceDocument: null,
		conversion: {
			enabled: true,
			targetType: 'invoice'
		},
		ui: {
			isLoading: true,
			isProcessing: false,
			error: null
		}
	};
}

export function formatTransformSummary(state: TransformReviewState): string {
	if (!state.conversion.enabled || !state.sourceDocument) {
		return 'No conversion selected';
	}

	if (state.sourceDocument.type === state.conversion.targetType) {
		return 'No conversion needed - already the target type';
	}

	return `Convert ${state.sourceDocument.type} to ${state.conversion.targetType}`;
}
