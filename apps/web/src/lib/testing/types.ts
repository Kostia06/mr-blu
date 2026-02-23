// AI Test Framework Types
// For automated testing of AI parser correctness

// =============================================
// TEST CASE DEFINITION
// =============================================

export interface AITestCase {
	id: string;
	category: TestCategory;
	description: string;
	input: string; // Voice transcription
	expectedIntent: IntentType;
	expectedData: ExpectedData;
	validationRules: ValidationRule[];
	priority: TestPriority;
	tags?: string[];
	expectsError?: boolean; // If true, test passes when API returns an error
}

export type TestCategory =
	| 'document_creation'
	| 'client_identification'
	| 'document_clone'
	| 'document_merge'
	| 'document_send'
	| 'document_transform'
	| 'information_query'
	| 'payment_reminder'
	| 'tax_handling'
	| 'edge_case';

export type IntentType =
	| 'document_action'
	| 'information_query'
	| 'document_clone'
	| 'document_merge'
	| 'document_send'
	| 'document_transform';

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';

// =============================================
// EXPECTED DATA TYPES
// =============================================

export type ExpectedData =
	| ExpectedDocumentAction
	| ExpectedInformationQuery
	| ExpectedDocumentClone
	| ExpectedDocumentMerge
	| ExpectedDocumentSend
	| ExpectedDocumentTransform;

export interface ExpectedDocumentAction {
	documentType?: 'invoice' | 'estimate';
	client?: {
		name?: string | null;
		firstName?: string | null;
		lastName?: string | null;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	items?: ExpectedLineItem[];
	total?: number;
	subtotal?: number;
	taxRate?: number | null;
	taxAmount?: number;
	taxes?: ExpectedTax[];
	discount?: {
		type?: 'percentage' | 'fixed';
		value?: number;
		amount?: number;
	};
	dueDate?: string | null;
	paymentTerms?: string;
	notes?: string;
	actions?: ExpectedAction[];
}

export interface ExpectedLineItem {
	description?: string;
	quantity?: number;
	unit?: string;
	rate?: number;
	total?: number;
	material?: string | null;
	measurementType?: 'sqft' | 'linear_ft' | 'unit' | 'hour' | 'job' | 'service' | null;
	dimensions?: {
		width?: number | null;
		length?: number | null;
		unit?: 'ft' | 'm' | null;
	} | null;
}

export interface ExpectedTax {
	type?: string;
	name?: string;
	rate?: number;
	amount?: number;
	isExempt?: boolean;
}

export interface ExpectedAction {
	type?: 'create_document' | 'send_email' | 'send_sms' | 'schedule' | 'save_draft';
	order?: number;
	details?: Record<string, unknown>;
}

export interface ExpectedInformationQuery {
	query?: {
		type?: 'list' | 'sum' | 'count' | 'details';
		documentTypes?: string[];
		clientName?: string | null;
		status?: 'draft' | 'sent' | 'paid' | 'pending' | 'overdue' | null;
		dateRange?: {
			start?: string | null;
			end?: string | null;
			period?: string | null;
		};
		sortBy?: string | null;
		limit?: number | null;
	};
	summary?: string;
}

export interface ExpectedDocumentClone {
	sourceClient?: string;
	targetClient?: {
		name?: string;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	documentType?: 'invoice' | 'estimate' | null;
	modifications?: {
		updateItems?: Array<{
			match?: string;
			newRate?: number | null;
			newQuantity?: number | null;
			newDescription?: string | null;
		}>;
		addItems?: Array<{
			description?: string;
			quantity?: number;
			unit?: string;
			rate?: number;
		}>;
		removeItems?: string[];
		newTotal?: number | null;
	};
}

export interface ExpectedDocumentMerge {
	sourceClients?: string[];
	targetClient?: {
		name?: string;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
	};
	documentType?: 'invoice' | 'estimate' | null;
}

export interface ExpectedDocumentSend {
	clientName?: string;
	documentType?: 'invoice' | 'estimate' | 'contract' | null;
	selector?: 'last' | 'latest' | 'recent' | 'first' | null;
	deliveryMethod?: 'email' | 'sms' | 'whatsapp';
	recipient?: {
		email?: string | null;
		phone?: string | null;
		clientName?: string | null;
	};
}

export interface ExpectedDocumentTransform {
	source?: {
		clientName?: string;
		documentType?: 'invoice' | 'estimate' | null;
		selector?: string | null;
		documentNumber?: string | null;
	};
	conversion?: {
		enabled?: boolean;
		targetType?: 'invoice' | 'estimate';
	};
	split?: {
		enabled?: boolean;
		numberOfParts?: number;
		splitMethod?: 'equal' | 'custom' | 'percentage';
		customAmounts?: number[] | null;
		percentages?: number[] | null;
	};
	schedule?: {
		enabled?: boolean;
		frequency?: {
			type?: 'days' | 'weeks' | 'months';
			interval?: number;
		} | null;
		startDate?: string | null;
		sendFirst?: boolean;
	};
}

// =============================================
// VALIDATION RULES
// =============================================

export interface ValidationRule {
	field: string; // Dot notation path (e.g., 'items.0.dimensions.width')
	operator: ValidationOperator;
	value?: unknown;
	tolerance?: number; // For numeric comparisons
	message?: string; // Custom error message
}

export type ValidationOperator =
	| 'equals'
	| 'notEquals'
	| 'contains'
	| 'notContains'
	| 'startsWith'
	| 'endsWith'
	| 'greaterThan'
	| 'greaterThanOrEqual'
	| 'lessThan'
	| 'lessThanOrEqual'
	| 'exists'
	| 'notExists'
	| 'isNull'
	| 'isNotNull'
	| 'arrayLength'
	| 'arrayContains'
	| 'between'
	| 'matches' // regex
	| 'typeOf';

// =============================================
// TEST RESULTS
// =============================================

export interface TestResult {
	testId: string;
	testCase: AITestCase;
	passed: boolean;
	duration: number; // milliseconds
	actualResponse: unknown;
	validationResults: ValidationResult[];
	error?: string;
}

export interface ValidationResult {
	rule: ValidationRule;
	passed: boolean;
	actualValue: unknown;
	expectedValue: unknown;
	message: string;
}

// =============================================
// TEST RUN CONFIGURATION
// =============================================

export interface TestRunConfig {
	categories?: TestCategory[];
	priorities?: TestPriority[];
	tags?: string[];
	testIds?: string[];
	maxConcurrent?: number;
	timeout?: number; // milliseconds per test
	stopOnFailure?: boolean;
	verbose?: boolean;
}

// =============================================
// TEST RUN REPORT
// =============================================

export interface TestRunReport {
	runId: string;
	startTime: Date;
	endTime: Date;
	duration: number;
	config: TestRunConfig;
	summary: TestRunSummary;
	categoryBreakdown: Record<TestCategory, CategoryResult>;
	priorityBreakdown: Record<TestPriority, CategoryResult>;
	results: TestResult[];
	failedTests: TestResult[];
}

export interface TestRunSummary {
	total: number;
	passed: number;
	failed: number;
	skipped: number;
	passRate: number; // 0-100 percentage
	averageDuration: number;
}

export interface CategoryResult {
	total: number;
	passed: number;
	failed: number;
	passRate: number;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Create a validation rule for equality check
 */
export function equals(field: string, value: unknown): ValidationRule {
	return { field, operator: 'equals', value };
}

/**
 * Create a validation rule for existence check
 */
export function exists(field: string): ValidationRule {
	return { field, operator: 'exists' };
}

/**
 * Create a validation rule for array length check
 */
export function arrayLength(field: string, length: number): ValidationRule {
	return { field, operator: 'arrayLength', value: length };
}

/**
 * Create a validation rule for greater than check
 */
export function greaterThan(field: string, value: number): ValidationRule {
	return { field, operator: 'greaterThan', value };
}

/**
 * Create a validation rule for greater than or equal check
 */
export function greaterThanOrEqual(field: string, value: number): ValidationRule {
	return { field, operator: 'greaterThanOrEqual', value };
}

/**
 * Create a validation rule for numeric comparison with tolerance
 */
export function approxEquals(
	field: string,
	value: number,
	tolerance: number = 0.01
): ValidationRule {
	return { field, operator: 'equals', value, tolerance };
}

/**
 * Create a validation rule for string contains check
 */
export function contains(field: string, value: string): ValidationRule {
	return { field, operator: 'contains', value };
}

/**
 * Create a validation rule for type check
 */
export function typeOf(field: string, type: string): ValidationRule {
	return { field, operator: 'typeOf', value: type };
}

/**
 * Create a validation rule for between check
 */
export function between(field: string, min: number, max: number): ValidationRule {
	return { field, operator: 'between', value: [min, max] };
}

/**
 * Create a validation rule for regex match
 */
export function matches(field: string, pattern: string | RegExp): ValidationRule {
	return {
		field,
		operator: 'matches',
		value: pattern instanceof RegExp ? pattern.source : pattern
	};
}

/**
 * Create a validation rule for null check
 */
export function isNull(field: string): ValidationRule {
	return { field, operator: 'isNull' };
}

/**
 * Create a validation rule for not null check
 */
export function isNotNull(field: string): ValidationRule {
	return { field, operator: 'isNotNull' };
}
