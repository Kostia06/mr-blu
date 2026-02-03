// Comprehensive AI Action Types for User Data Operations
// All actions are scoped to user's own data only

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

export type ActionCategory =
	| 'document' // Document operations (create, edit, delete, etc.)
	| 'client' // Client management
	| 'communication' // Sending, sharing, notifications
	| 'scheduling' // Recurring, reminders, follow-ups
	| 'query' // Information retrieval
	| 'bulk'; // Batch operations

// ============================================================================
// DOCUMENT ACTIONS
// ============================================================================

export type DocumentActionType =
	| 'create' // Create new document from scratch
	| 'edit' // Edit existing document
	| 'update' // Update specific fields
	| 'duplicate' // Copy document for same client
	| 'clone' // Copy document for different client
	| 'merge' // Combine multiple documents
	| 'split' // Split document into multiple
	| 'delete' // Delete document
	| 'archive' // Archive document
	| 'restore' // Restore archived/deleted
	| 'convert' // Convert type (estimate -> invoice)
	| 'void' // Mark as void/cancelled
	| 'mark_paid' // Mark invoice as paid
	| 'add_payment' // Record partial payment
	| 'apply_discount' // Apply discount to document
	| 'add_items' // Add line items to existing
	| 'remove_items' // Remove line items
	| 'update_items' // Update line item details
	| 'recalculate'; // Recalculate totals

// ============================================================================
// CLIENT ACTIONS
// ============================================================================

export type ClientActionType =
	| 'create' // Create new client
	| 'edit' // Edit client details
	| 'merge' // Merge duplicate clients
	| 'delete' // Delete client
	| 'archive' // Archive client
	| 'add_note' // Add note to client
	| 'update_contact' // Update contact info
	| 'tag' // Add tags to client
	| 'set_default'; // Set default payment terms, etc.

// ============================================================================
// COMMUNICATION ACTIONS
// ============================================================================

export type CommunicationActionType =
	| 'send_email' // Send via email
	| 'send_sms' // Send via SMS
	| 'send_whatsapp' // Send via WhatsApp
	| 'share_link' // Generate shareable link
	| 'resend' // Resend previously sent
	| 'send_reminder' // Send payment reminder
	| 'send_receipt' // Send payment receipt
	| 'send_thank_you' // Send thank you message
	| 'send_follow_up' // Send follow-up message
	| 'notify_self'; // Send notification to self

// ============================================================================
// SCHEDULING ACTIONS
// ============================================================================

export type SchedulingActionType =
	| 'schedule_send' // Schedule future send
	| 'schedule_recurring' // Set up recurring document
	| 'set_reminder' // Set reminder for self
	| 'set_follow_up' // Schedule follow-up
	| 'set_due_date' // Set/change due date
	| 'pause_recurring' // Pause recurring schedule
	| 'resume_recurring' // Resume recurring schedule
	| 'cancel_scheduled'; // Cancel scheduled action

// ============================================================================
// QUERY ACTIONS
// ============================================================================

export type QueryActionType =
	| 'list' // List documents/clients
	| 'search' // Search with criteria
	| 'count' // Count matching items
	| 'sum' // Sum amounts
	| 'average' // Calculate average
	| 'find' // Find specific item
	| 'compare' // Compare documents/periods
	| 'report' // Generate report
	| 'export'; // Export data

// ============================================================================
// BULK ACTIONS
// ============================================================================

export type BulkActionType =
	| 'bulk_send' // Send multiple documents
	| 'bulk_delete' // Delete multiple
	| 'bulk_archive' // Archive multiple
	| 'bulk_update' // Update multiple
	| 'bulk_export' // Export multiple
	| 'bulk_reminder'; // Send reminders to multiple

// ============================================================================
// UNIFIED ACTION INTERFACE
// ============================================================================

export interface AIAction {
	id: string;
	category: ActionCategory;
	type: string; // One of the action types above
	status: ActionStatus;
	priority: number;

	// Target specification
	target: ActionTarget;

	// Action-specific data
	data: ActionData;

	// Preview/confirmation
	preview: ActionPreview;

	// Execution result
	result?: ActionResult;

	// Metadata
	createdAt: string;
	executedAt?: string;
	error?: string;
}

export type ActionStatus =
	| 'pending' // Waiting for user approval
	| 'previewing' // User is previewing/editing
	| 'confirmed' // User confirmed, ready to execute
	| 'in_progress' // Currently executing
	| 'completed' // Successfully completed
	| 'failed' // Execution failed
	| 'cancelled' // User cancelled
	| 'skipped'; // Skipped by user

// ============================================================================
// ACTION TARGET
// ============================================================================

export interface ActionTarget {
	// What type of entity
	entityType: 'document' | 'client' | 'payment' | 'schedule' | 'multiple';

	// How to identify target(s)
	identifier: TargetIdentifier;

	// Resolved entity info (after lookup)
	resolved?: ResolvedTarget;
}

export type TargetIdentifier =
	| { type: 'id'; value: string }
	| { type: 'latest'; filters?: TargetFilters }
	| { type: 'search'; query: string; filters?: TargetFilters }
	| { type: 'client_name'; name: string }
	| { type: 'document_number'; number: string }
	| { type: 'date_range'; start: string; end: string }
	| { type: 'new' }
	| { type: 'multiple'; identifiers: TargetIdentifier[] };

export interface TargetFilters {
	documentType?: ('invoice' | 'estimate' | 'quote' | 'report')[];
	status?: string[];
	clientId?: string;
	clientName?: string;
	dateFrom?: string;
	dateTo?: string;
	amountMin?: number;
	amountMax?: number;
	tags?: string[];
}

export interface ResolvedTarget {
	id: string;
	type: string;
	displayName: string;
	summary?: string;
	data?: Record<string, unknown>;
}

// ============================================================================
// ACTION DATA
// ============================================================================

export interface ActionData {
	// Document creation/editing
	document?: DocumentActionData;

	// Client operations
	client?: ClientActionData;

	// Communication
	communication?: CommunicationActionData;

	// Scheduling
	scheduling?: SchedulingActionData;

	// Query/report
	query?: QueryActionData;

	// Bulk operations
	bulk?: BulkActionData;

	// Generic key-value updates
	updates?: Record<string, unknown>;
}

export interface DocumentActionData {
	type?: 'invoice' | 'estimate' | 'quote' | 'report';

	// Client info
	client?: {
		name?: string;
		email?: string;
		phone?: string;
		address?: string;
	};

	// Line items
	items?: LineItemData[];
	itemsToAdd?: LineItemData[];
	itemsToRemove?: string[]; // IDs
	itemsToUpdate?: { id: string; updates: Partial<LineItemData> }[];

	// Financial
	subtotal?: number;
	taxRate?: number;
	taxAmount?: number;
	discount?: number;
	discountType?: 'percentage' | 'fixed';
	total?: number;

	// Payment
	amountPaid?: number;
	paymentMethod?: string;
	paymentDate?: string;
	paymentNote?: string;

	// Dates
	date?: string;
	dueDate?: string;

	// Conversion
	convertTo?: 'invoice' | 'estimate';

	// Source for clone/merge
	sourceDocumentId?: string;
	sourceDocumentIds?: string[];

	// Notes
	notes?: string;
	internalNotes?: string;
}

export interface LineItemData {
	id?: string;
	description: string;
	quantity?: number;
	unit?: string;
	rate?: number;
	amount?: number;
}

export interface ClientActionData {
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	notes?: string;
	tags?: string[];
	defaultPaymentTerms?: number;
	mergeWithClientId?: string;
}

export interface CommunicationActionData {
	method: 'email' | 'sms' | 'whatsapp' | 'link';
	recipient?: {
		email?: string;
		phone?: string;
		name?: string;
	};
	subject?: string;
	message?: string;
	includeAttachment?: boolean;
	attachmentFormat?: 'pdf' | 'link';
	cc?: string[];
	bcc?: string[];
	replyTo?: string;
}

export interface SchedulingActionData {
	frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
	startDate: string;
	endDate?: string;
	time?: string;
	timezone?: string;
	occurrences?: number;
	reminderBefore?: number; // minutes
	action: string; // What action to perform
}

export interface QueryActionData {
	queryType: 'list' | 'search' | 'count' | 'sum' | 'average' | 'find' | 'compare' | 'report';
	entityType: 'document' | 'client' | 'payment';
	filters?: TargetFilters;
	groupBy?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	limit?: number;
	fields?: string[];
	compareWith?: {
		type: 'previous_period' | 'custom_range' | 'document';
		value?: string;
	};
}

export interface BulkActionData {
	action: string;
	targetIds?: string[];
	filters?: TargetFilters;
	updateData?: Record<string, unknown>;
}

// ============================================================================
// ACTION PREVIEW
// ============================================================================

export interface ActionPreview {
	// Human-readable summary
	title: string;
	description: string;

	// What will change
	changes: PreviewChange[];

	// Warnings/confirmations needed
	warnings?: string[];
	requiresConfirmation?: boolean;
	confirmationMessage?: string;

	// Editable template data
	editableData?: EditablePreviewData;

	// Visual preview (for documents)
	documentPreview?: DocumentPreviewData;
}

export interface PreviewChange {
	field: string;
	label: string;
	oldValue?: unknown;
	newValue: unknown;
	type: 'add' | 'update' | 'remove' | 'unchanged';
}

export interface EditablePreviewData {
	// Which fields can be edited
	editableFields: string[];

	// Current values
	values: Record<string, unknown>;

	// Field metadata for UI
	fieldMeta: Record<string, FieldMeta>;
}

export interface FieldMeta {
	label: string;
	type:
		| 'text'
		| 'number'
		| 'date'
		| 'email'
		| 'phone'
		| 'select'
		| 'textarea'
		| 'currency'
		| 'items';
	required?: boolean;
	placeholder?: string;
	options?: { value: string; label: string }[];
	min?: number;
	max?: number;
	step?: number;
}

export interface DocumentPreviewData {
	documentType: string;
	documentNumber: string;
	client: { name: string; email?: string };
	items: LineItemData[];
	subtotal: number;
	tax: number;
	total: number;
	date: string;
	dueDate?: string;
}

// ============================================================================
// ACTION RESULT
// ============================================================================

export interface ActionResult {
	success: boolean;
	message: string;

	// Created/updated entity
	entityId?: string;
	entityType?: string;

	// For queries
	data?: unknown;
	count?: number;

	// For communications
	sentTo?: string;
	deliveryStatus?: string;

	// For bulk operations
	processed?: number;
	failed?: number;
	results?: ActionResult[];

	// Next steps / suggestions
	suggestions?: ActionSuggestion[];
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

export interface ActionSuggestion {
	id: string;
	category: ActionCategory;
	type: string;

	// Display
	icon: string;
	title: string;
	description: string;

	// Quick action or needs more info
	quickAction: boolean;

	// Pre-filled action data
	actionTemplate: Partial<AIAction>;

	// Relevance score (0-1)
	relevance: number;

	// Context why this is suggested
	reason?: string;
}

// ============================================================================
// SUGGESTION CATEGORIES
// ============================================================================

export const SUGGESTION_TEMPLATES: Record<string, Partial<ActionSuggestion>[]> = {
	// After creating a document
	after_document_create: [
		{
			icon: 'send',
			title: 'Send to client',
			description: 'Email or text this document to the client',
			quickAction: false,
			category: 'communication',
			type: 'send_email'
		},
		{
			icon: 'copy',
			title: 'Create another for same client',
			description: 'Duplicate this document',
			quickAction: true,
			category: 'document',
			type: 'duplicate'
		},
		{
			icon: 'calendar',
			title: 'Schedule recurring',
			description: 'Set up automatic recurring invoices',
			quickAction: false,
			category: 'scheduling',
			type: 'schedule_recurring'
		},
		{
			icon: 'bell',
			title: 'Set payment reminder',
			description: 'Get notified before due date',
			quickAction: false,
			category: 'scheduling',
			type: 'set_reminder'
		}
	],

	// After sending a document
	after_document_send: [
		{
			icon: 'clock',
			title: 'Schedule follow-up',
			description: 'Remind yourself to follow up',
			quickAction: false,
			category: 'scheduling',
			type: 'set_follow_up'
		},
		{
			icon: 'refresh',
			title: 'Resend document',
			description: 'Send again to same recipient',
			quickAction: true,
			category: 'communication',
			type: 'resend'
		},
		{
			icon: 'users',
			title: 'Send to another contact',
			description: 'Share with additional recipient',
			quickAction: false,
			category: 'communication',
			type: 'send_email'
		}
	],

	// After marking paid
	after_mark_paid: [
		{
			icon: 'receipt',
			title: 'Send receipt',
			description: 'Email payment confirmation to client',
			quickAction: true,
			category: 'communication',
			type: 'send_receipt'
		},
		{
			icon: 'heart',
			title: 'Send thank you',
			description: 'Send appreciation message',
			quickAction: false,
			category: 'communication',
			type: 'send_thank_you'
		},
		{
			icon: 'file-plus',
			title: 'Create next invoice',
			description: 'Start new invoice for this client',
			quickAction: false,
			category: 'document',
			type: 'create'
		}
	],

	// After viewing document list
	after_query_list: [
		{
			icon: 'download',
			title: 'Export to CSV',
			description: 'Download this list as spreadsheet',
			quickAction: true,
			category: 'query',
			type: 'export'
		},
		{
			icon: 'send',
			title: 'Send reminders',
			description: 'Send payment reminders to unpaid',
			quickAction: false,
			category: 'bulk',
			type: 'bulk_reminder'
		},
		{
			icon: 'archive',
			title: 'Archive old',
			description: 'Archive documents older than 1 year',
			quickAction: false,
			category: 'bulk',
			type: 'bulk_archive'
		}
	],

	// General suggestions (always available)
	general: [
		{
			icon: 'file-plus',
			title: 'New invoice',
			description: 'Create a new invoice',
			quickAction: false,
			category: 'document',
			type: 'create'
		},
		{
			icon: 'file-text',
			title: 'New estimate',
			description: 'Create a new estimate/quote',
			quickAction: false,
			category: 'document',
			type: 'create'
		},
		{
			icon: 'search',
			title: 'Find document',
			description: 'Search your documents',
			quickAction: false,
			category: 'query',
			type: 'search'
		},
		{
			icon: 'users',
			title: 'View clients',
			description: 'See all your clients',
			quickAction: true,
			category: 'query',
			type: 'list'
		},
		{
			icon: 'dollar-sign',
			title: 'Unpaid invoices',
			description: 'View outstanding payments',
			quickAction: true,
			category: 'query',
			type: 'list'
		},
		{
			icon: 'trending-up',
			title: "This month's total",
			description: 'Sum of invoices this month',
			quickAction: true,
			category: 'query',
			type: 'sum'
		}
	]
};

// ============================================================================
// ACTION TEMPLATES - Predefined action configurations
// ============================================================================

export const ACTION_TEMPLATES: Record<string, Partial<AIAction>> = {
	// Document actions
	create_invoice: {
		category: 'document',
		type: 'create',
		data: { document: { type: 'invoice' } },
		preview: {
			title: 'Create Invoice',
			description: 'Create a new invoice for your client',
			changes: [],
			editableData: {
				editableFields: ['client.name', 'client.email', 'items', 'dueDate', 'taxRate', 'notes'],
				values: {},
				fieldMeta: {
					'client.name': { label: 'Client Name', type: 'text', required: true },
					'client.email': { label: 'Client Email', type: 'email' },
					items: { label: 'Line Items', type: 'items', required: true },
					dueDate: { label: 'Due Date', type: 'date' },
					taxRate: { label: 'Tax Rate (%)', type: 'number', min: 0, max: 100 },
					notes: { label: 'Notes', type: 'textarea' }
				}
			}
		}
	},

	create_estimate: {
		category: 'document',
		type: 'create',
		data: { document: { type: 'estimate' } },
		preview: {
			title: 'Create Estimate',
			description: 'Create a new estimate/quote for your client',
			changes: [],
			editableData: {
				editableFields: ['client.name', 'client.email', 'items', 'validUntil', 'taxRate', 'notes'],
				values: {},
				fieldMeta: {
					'client.name': { label: 'Client Name', type: 'text', required: true },
					'client.email': { label: 'Client Email', type: 'email' },
					items: { label: 'Line Items', type: 'items', required: true },
					validUntil: { label: 'Valid Until', type: 'date' },
					taxRate: { label: 'Tax Rate (%)', type: 'number', min: 0, max: 100 },
					notes: { label: 'Notes', type: 'textarea' }
				}
			}
		}
	},

	edit_document: {
		category: 'document',
		type: 'edit',
		preview: {
			title: 'Edit Document',
			description: 'Modify an existing document',
			changes: [],
			requiresConfirmation: true,
			confirmationMessage: 'Save changes to this document?'
		}
	},

	convert_to_invoice: {
		category: 'document',
		type: 'convert',
		data: { document: { convertTo: 'invoice' } },
		preview: {
			title: 'Convert to Invoice',
			description: 'Convert this estimate to an invoice',
			changes: [
				{
					field: 'type',
					label: 'Document Type',
					oldValue: 'estimate',
					newValue: 'invoice',
					type: 'update'
				}
			],
			requiresConfirmation: true
		}
	},

	mark_paid: {
		category: 'document',
		type: 'mark_paid',
		preview: {
			title: 'Mark as Paid',
			description: 'Record full payment for this invoice',
			changes: [
				{ field: 'status', label: 'Status', oldValue: 'sent', newValue: 'paid', type: 'update' }
			],
			editableData: {
				editableFields: ['paymentDate', 'paymentMethod', 'paymentNote'],
				values: { paymentDate: new Date().toISOString().split('T')[0] },
				fieldMeta: {
					paymentDate: { label: 'Payment Date', type: 'date', required: true },
					paymentMethod: {
						label: 'Payment Method',
						type: 'select',
						options: [
							{ value: 'cash', label: 'Cash' },
							{ value: 'check', label: 'Check' },
							{ value: 'card', label: 'Credit/Debit Card' },
							{ value: 'transfer', label: 'Bank Transfer' },
							{ value: 'other', label: 'Other' }
						]
					},
					paymentNote: { label: 'Note', type: 'text' }
				}
			}
		}
	},

	add_payment: {
		category: 'document',
		type: 'add_payment',
		preview: {
			title: 'Record Payment',
			description: 'Record a partial payment',
			changes: [],
			editableData: {
				editableFields: ['amountPaid', 'paymentDate', 'paymentMethod', 'paymentNote'],
				values: { paymentDate: new Date().toISOString().split('T')[0] },
				fieldMeta: {
					amountPaid: { label: 'Amount Paid', type: 'currency', required: true, min: 0 },
					paymentDate: { label: 'Payment Date', type: 'date', required: true },
					paymentMethod: {
						label: 'Payment Method',
						type: 'select',
						options: [
							{ value: 'cash', label: 'Cash' },
							{ value: 'check', label: 'Check' },
							{ value: 'card', label: 'Credit/Debit Card' },
							{ value: 'transfer', label: 'Bank Transfer' },
							{ value: 'other', label: 'Other' }
						]
					},
					paymentNote: { label: 'Note', type: 'text' }
				}
			}
		}
	},

	clone_document: {
		category: 'document',
		type: 'clone',
		preview: {
			title: 'Clone for New Client',
			description: 'Copy this document for a different client',
			changes: [],
			editableData: {
				editableFields: ['client.name', 'client.email', 'date', 'dueDate'],
				values: {},
				fieldMeta: {
					'client.name': { label: 'New Client Name', type: 'text', required: true },
					'client.email': { label: 'Client Email', type: 'email' },
					date: { label: 'Document Date', type: 'date' },
					dueDate: { label: 'Due Date', type: 'date' }
				}
			}
		}
	},

	merge_documents: {
		category: 'document',
		type: 'merge',
		preview: {
			title: 'Merge Documents',
			description: 'Combine items from multiple documents',
			changes: [],
			requiresConfirmation: true,
			confirmationMessage: 'This will create a new document with combined items.'
		}
	},

	delete_document: {
		category: 'document',
		type: 'delete',
		preview: {
			title: 'Delete Document',
			description: 'Permanently delete this document',
			changes: [],
			warnings: ['This action cannot be undone.'],
			requiresConfirmation: true,
			confirmationMessage: 'Are you sure you want to delete this document?'
		}
	},

	// Communication actions
	send_email: {
		category: 'communication',
		type: 'send_email',
		data: { communication: { method: 'email', includeAttachment: true, attachmentFormat: 'pdf' } },
		preview: {
			title: 'Send via Email',
			description: 'Email this document to the client',
			changes: [],
			editableData: {
				editableFields: ['recipient.email', 'subject', 'message'],
				values: {},
				fieldMeta: {
					'recipient.email': { label: 'To', type: 'email', required: true },
					subject: { label: 'Subject', type: 'text' },
					message: { label: 'Message', type: 'textarea', placeholder: 'Add a personal message...' }
				}
			}
		}
	},

	send_sms: {
		category: 'communication',
		type: 'send_sms',
		data: { communication: { method: 'sms' } },
		preview: {
			title: 'Send via SMS',
			description: 'Text a link to this document',
			changes: [],
			editableData: {
				editableFields: ['recipient.phone', 'message'],
				values: {},
				fieldMeta: {
					'recipient.phone': { label: 'Phone Number', type: 'phone', required: true },
					message: {
						label: 'Message',
						type: 'textarea',
						placeholder: 'Brief message with document link...'
					}
				}
			}
		}
	},

	send_reminder: {
		category: 'communication',
		type: 'send_reminder',
		preview: {
			title: 'Send Payment Reminder',
			description: 'Remind client about unpaid invoice',
			changes: [],
			editableData: {
				editableFields: ['method', 'message'],
				values: { method: 'email' },
				fieldMeta: {
					method: {
						label: 'Send Via',
						type: 'select',
						options: [
							{ value: 'email', label: 'Email' },
							{ value: 'sms', label: 'SMS' }
						]
					},
					message: { label: 'Message', type: 'textarea' }
				}
			}
		}
	},

	// Scheduling actions
	schedule_recurring: {
		category: 'scheduling',
		type: 'schedule_recurring',
		preview: {
			title: 'Set Up Recurring',
			description: 'Automatically create this document on a schedule',
			changes: [],
			editableData: {
				editableFields: ['frequency', 'startDate', 'endDate', 'autoSend'],
				values: { frequency: 'monthly', autoSend: false },
				fieldMeta: {
					frequency: {
						label: 'Frequency',
						type: 'select',
						required: true,
						options: [
							{ value: 'weekly', label: 'Weekly' },
							{ value: 'biweekly', label: 'Every 2 Weeks' },
							{ value: 'monthly', label: 'Monthly' },
							{ value: 'quarterly', label: 'Quarterly' },
							{ value: 'yearly', label: 'Yearly' }
						]
					},
					startDate: { label: 'Start Date', type: 'date', required: true },
					endDate: { label: 'End Date (Optional)', type: 'date' },
					autoSend: {
						label: 'Auto-send to client',
						type: 'select',
						options: [
							{ value: 'true', label: 'Yes' },
							{ value: 'false', label: 'No, just create' }
						]
					}
				}
			}
		}
	},

	set_reminder: {
		category: 'scheduling',
		type: 'set_reminder',
		preview: {
			title: 'Set Reminder',
			description: 'Get notified about this document',
			changes: [],
			editableData: {
				editableFields: ['reminderDate', 'reminderTime', 'note'],
				values: {},
				fieldMeta: {
					reminderDate: { label: 'Date', type: 'date', required: true },
					reminderTime: { label: 'Time', type: 'text', placeholder: '9:00 AM' },
					note: { label: 'Note', type: 'text', placeholder: 'What to remember...' }
				}
			}
		}
	}
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createAction(
	template: keyof typeof ACTION_TEMPLATES,
	overrides?: Partial<AIAction>
): AIAction {
	const base = ACTION_TEMPLATES[template];
	return {
		id: crypto.randomUUID(),
		category: base?.category || 'document',
		type: base?.type || template,
		status: 'pending',
		priority: 1,
		target: { entityType: 'document', identifier: { type: 'new' } },
		data: {},
		preview: { title: '', description: '', changes: [] },
		createdAt: new Date().toISOString(),
		...base,
		...overrides
	} as AIAction;
}

export function getSuggestionsForContext(
	context: keyof typeof SUGGESTION_TEMPLATES,
	limit = 6
): Partial<ActionSuggestion>[] {
	const contextSuggestions = SUGGESTION_TEMPLATES[context] || [];
	const generalSuggestions = SUGGESTION_TEMPLATES.general || [];

	return [...contextSuggestions, ...generalSuggestions].slice(0, limit);
}

export function generateActionPreview(action: AIAction): ActionPreview {
	const template = ACTION_TEMPLATES[action.type];
	if (template?.preview) {
		return { ...template.preview };
	}

	return {
		title: action.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
		description: `Perform ${action.type} action`,
		changes: []
	};
}
