import { createClient } from '$lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TransformJob, TransformJobConfig, TransformGeneratedDoc } from '$lib/types/transform';
import { calculateSimilarity } from '$lib/utils/phonetic';

// =============================================
// TYPES
// =============================================

export interface TransformConfig {
	sourceDocumentId: string;
	sourceDocumentType: 'invoice' | 'estimate';
	conversion: {
		enabled: boolean;
		targetType: 'invoice' | 'estimate';
	};
}

export interface TransformResult {
	success: boolean;
	job?: TransformJob;
	generatedDocument?: TransformGeneratedDoc;
	error?: string;
}

export interface SourceDocumentData {
	id: string;
	type: 'invoice' | 'estimate';
	number: string;
	total: number;
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	clientId: string;
	clientName: string;
	clientEmail: string;
	clientPhone: string;
	clientAddress: string;
	items: Array<{
		id: string;
		description: string;
		quantity: number;
		rate: number;
		total: number;
		unit?: string;
	}>;
	notes: string | null;
	dueDate: string | null;
	createdAt: Date;
}

// =============================================
// HELPERS
// =============================================

export function roundCurrency(value: number): number {
	return Math.round(value * 100) / 100;
}

// =============================================
// DOCUMENT NUMBER GENERATION
// =============================================

export async function generateDocumentNumber(
	supabase: SupabaseClient,
	userId: string,
	type: 'invoice' | 'estimate'
): Promise<string> {
	// Get current year
	const year = new Date().getFullYear();
	const prefix = type === 'invoice' ? 'INV' : 'EST';

	// Find the highest existing number for this user and type this year
	const pattern = `${prefix}-${year}-%`;
	const { data: existingDocs } = await supabase
		.from('invoices')
		.select('invoice_number')
		.eq('user_id', userId)
		.like('invoice_number', pattern)
		.order('invoice_number', { ascending: false })
		.limit(10);

	let nextNumber = 1;
	if (existingDocs && existingDocs.length > 0) {
		for (const doc of existingDocs) {
			const match = doc.invoice_number?.match(new RegExp(`${prefix}-${year}-(\\d+)`));
			if (match) {
				const num = parseInt(match[1], 10);
				if (num >= nextNumber) nextNumber = num + 1;
			}
		}
	}
	return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// =============================================
// FETCH SOURCE DOCUMENT
// =============================================

export async function fetchSourceDocument(
	documentId: string,
	documentType: 'invoice' | 'estimate'
): Promise<SourceDocumentData | null> {
	const supabase = createClient();

	// Fetch document with client info
	const { data: doc, error } = await supabase
		.from('invoices')
		.select(
			`
			*,
			clients (
				id,
				name,
				email,
				phone,
				address
			)
		`
		)
		.eq('id', documentId)
		.eq('document_type', documentType)
		.single();

	if (error || !doc) {
		console.error('Error fetching source document:', error);
		return null;
	}

	const client = doc.clients as {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		address: string | null;
	} | null;

	return {
		id: doc.id,
		type: doc.document_type,
		number: doc.invoice_number,
		total: doc.total,
		subtotal: doc.subtotal,
		taxRate: doc.tax_rate,
		taxAmount: doc.tax_amount,
		clientId: doc.client_id || '',
		clientName: client?.name || 'Unknown Client',
		clientEmail: client?.email || '',
		clientPhone: client?.phone || '',
		clientAddress: client?.address || '',
		items: (doc.line_items || []).map(
			(
				item: {
					id?: string;
					description: string;
					quantity?: number;
					rate?: number;
					total: number;
					unit?: string;
				},
				index: number
			) => ({
				id: item.id || `item-${index}`,
				description: item.description,
				quantity: item.quantity || 1,
				rate: item.rate || item.total,
				total: item.total,
				unit: item.unit
			})
		),
		notes: doc.notes,
		dueDate: doc.due_date,
		createdAt: new Date(doc.created_at)
	};
}

// =============================================
// FIND SIMILAR CLIENTS (for suggestions)
// =============================================

export interface ClientSuggestion {
	id: string;
	name: string;
	estimateCount: number;
	invoiceCount: number;
	similarity: number;
}

export async function findSimilarClients(
	searchName: string,
	supabaseClient?: SupabaseClient,
	userId?: string
): Promise<ClientSuggestion[]> {
	const supabase = supabaseClient || createClient();

	let userIdToUse = userId;
	if (!userIdToUse) {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return [];
		userIdToUse = user.id;
	}

	// Get all clients for this user with document counts
	const { data: clients, error } = await supabase
		.from('clients')
		.select('id, name')
		.eq('user_id', userIdToUse)
		.order('created_at', { ascending: false });

	if (error || !clients || clients.length === 0) {
		return [];
	}

	// Get document counts for each client and calculate similarity
	const suggestions: ClientSuggestion[] = [];

	for (const client of clients) {
		// Get estimate count
		const { count: estimateCount } = await supabase
			.from('invoices')
			.select('*', { count: 'exact', head: true })
			.eq('client_id', client.id)
			.eq('document_type', 'estimate');

		// Get invoice count
		const { count: invoiceCount } = await supabase
			.from('invoices')
			.select('*', { count: 'exact', head: true })
			.eq('client_id', client.id)
			.eq('document_type', 'invoice');

		// Only include clients with at least one document
		if ((estimateCount || 0) > 0 || (invoiceCount || 0) > 0) {
			// Calculate phonetic similarity score
			const similarity = calculateSimilarity(searchName, client.name);

			suggestions.push({
				id: client.id,
				name: client.name,
				estimateCount: estimateCount || 0,
				invoiceCount: invoiceCount || 0,
				similarity
			});
		}
	}

	// Sort by similarity score (highest first)
	suggestions.sort((a, b) => b.similarity - a.similarity);

	// Filter by minimum similarity threshold (0.3) and return top 5
	return suggestions.filter((s) => s.similarity >= 0.3).slice(0, 5);
}

// =============================================
// FIND SOURCE DOCUMENT BY CLIENT
// =============================================

export async function findSourceDocumentByClient(
	clientName: string,
	documentType: 'invoice' | 'estimate' | null,
	selector: 'last' | 'latest' | 'recent' | null,
	supabaseClient?: SupabaseClient,
	userId?: string
): Promise<SourceDocumentData | null> {
	const supabase = supabaseClient || createClient();

	// Get user ID from parameter or from auth
	let userIdToUse = userId;
	if (!userIdToUse) {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) return null;
		userIdToUse = user.id;
	}

	// First find the client
	const { data: clients } = await supabase
		.from('clients')
		.select('id, name, email, phone, address')
		.eq('user_id', userIdToUse)
		.ilike('name', `%${clientName}%`)
		.limit(1);

	if (!clients || clients.length === 0) {
		console.error('Client not found:', clientName);
		return null;
	}

	const client = clients[0];

	// Build document query
	let query = supabase
		.from('invoices')
		.select('*')
		.eq('user_id', userIdToUse)
		.eq('client_id', client.id);

	if (documentType) {
		query = query.eq('document_type', documentType);
	}

	// Order by most recent
	query = query.order('created_at', { ascending: false }).limit(1);

	const { data: docs, error } = await query;

	if (error || !docs || docs.length === 0) {
		console.error('No document found for client:', clientName);
		return null;
	}

	const doc = docs[0];

	return {
		id: doc.id,
		type: doc.document_type,
		number: doc.invoice_number,
		total: doc.total,
		subtotal: doc.subtotal,
		taxRate: doc.tax_rate,
		taxAmount: doc.tax_amount,
		clientId: client.id,
		clientName: client.name,
		clientEmail: client.email || '',
		clientPhone: client.phone || '',
		clientAddress: client.address || '',
		items: (doc.line_items || []).map(
			(
				item: {
					id?: string;
					description: string;
					quantity?: number;
					rate?: number;
					total: number;
					unit?: string;
				},
				index: number
			) => ({
				id: item.id || `item-${index}`,
				description: item.description,
				quantity: item.quantity || 1,
				rate: item.rate || item.total,
				total: item.total,
				unit: item.unit
			})
		),
		notes: doc.notes,
		dueDate: doc.due_date,
		createdAt: new Date(doc.created_at)
	};
}

// =============================================
// EXECUTE TRANSFORM (CONVERSION ONLY)
// =============================================

export async function executeTransform(
	config: TransformConfig,
	supabaseClient?: SupabaseClient,
	userId?: string
): Promise<TransformResult> {
	const supabase = supabaseClient || createClient();

	let userIdToUse = userId;
	if (!userIdToUse) {
		const {
			data: { user }
		} = await supabase.auth.getUser();
		if (!user) {
			return { success: false, error: 'Not authenticated' };
		}
		userIdToUse = user.id;
	}

	try {
		// 1. Fetch source document
		const sourceDoc = await fetchSourceDocument(config.sourceDocumentId, config.sourceDocumentType);

		if (!sourceDoc) {
			return { success: false, error: 'Source document not found' };
		}

		// 2. Validate conversion makes sense
		const targetType = config.conversion.targetType;
		if (sourceDoc.type === targetType) {
			return { success: false, error: 'Source document is already the target type' };
		}

		// 3. Create transform job record
		const jobConfig: TransformJobConfig = {
			conversion: {
				enabled: true,
				targetType
			}
		};

		const { data: job, error: jobError } = await supabase
			.from('transform_jobs')
			.insert({
				user_id: userIdToUse,
				source_document_id: config.sourceDocumentId,
				source_document_type: config.sourceDocumentType,
				source_total: sourceDoc.total,
				source_client_id: sourceDoc.clientId,
				config: jobConfig,
				status: 'processing'
			})
			.select()
			.single();

		if (jobError || !job) {
			console.error('Error creating transform job:', jobError);
			return { success: false, error: 'Failed to create transform job' };
		}

		// 4. Generate document number
		const docNumber = await generateDocumentNumber(supabase, userIdToUse, targetType);

		// 5. Create the converted document
		const { data: newDoc, error: docError } = await supabase
			.from('invoices')
			.insert({
				user_id: userIdToUse,
				client_id: sourceDoc.clientId,
				document_type: targetType,
				invoice_number: docNumber,
				title: `${targetType === 'invoice' ? 'Invoice' : 'Estimate'} - Converted from ${sourceDoc.type}`,
				line_items: sourceDoc.items,
				subtotal: sourceDoc.subtotal,
				tax_rate: sourceDoc.taxRate,
				tax_amount: sourceDoc.taxAmount,
				total: sourceDoc.total,
				notes: sourceDoc.notes,
				status: 'draft',
				transform_job_id: job.id
			})
			.select()
			.single();

		if (docError || !newDoc) {
			console.error('Error creating document:', docError);
			// Mark job as failed
			await supabase.from('transform_jobs').update({ status: 'cancelled' }).eq('id', job.id);
			return { success: false, error: 'Failed to create converted document' };
		}

		// 6. Record generated document
		const { data: genDoc } = await supabase
			.from('transform_generated_docs')
			.insert({
				transform_job_id: job.id,
				document_id: newDoc.id,
				document_number: docNumber,
				amount: sourceDoc.total,
				type: targetType,
				status: 'created'
			})
			.select()
			.single();

		const generatedDocument: TransformGeneratedDoc = {
			id: genDoc?.id || '',
			transformJobId: job.id,
			documentId: newDoc.id,
			documentNumber: docNumber,
			amount: sourceDoc.total,
			type: targetType,
			status: 'created',
			sentAt: null,
			createdAt: new Date()
		};

		// 7. Mark job as completed
		await supabase
			.from('transform_jobs')
			.update({
				status: 'completed',
				completed_at: new Date().toISOString()
			})
			.eq('id', job.id);

		return {
			success: true,
			job: {
				id: job.id,
				userId: userIdToUse,
				sourceDocumentId: config.sourceDocumentId,
				sourceDocumentType: config.sourceDocumentType,
				sourceTotal: sourceDoc.total,
				sourceClientId: sourceDoc.clientId,
				config: jobConfig,
				generatedDocument,
				status: 'completed',
				createdAt: new Date(job.created_at),
				updatedAt: new Date(),
				completedAt: new Date()
			},
			generatedDocument
		};
	} catch (error) {
		console.error('Transform execution error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Transform failed'
		};
	}
}

// =============================================
// GET TRANSFORM JOB
// =============================================

export async function getTransformJob(jobId: string): Promise<TransformJob | null> {
	const supabase = createClient();

	const { data: job, error } = await supabase
		.from('transform_jobs')
		.select(
			`
			*,
			transform_generated_docs (*)
		`
		)
		.eq('id', jobId)
		.single();

	if (error || !job) {
		console.error('Error fetching transform job:', error);
		return null;
	}

	const generatedDocs = job.transform_generated_docs || [];
	const generatedDocument =
		generatedDocs.length > 0
			? {
					id: generatedDocs[0].id,
					transformJobId: generatedDocs[0].transform_job_id,
					documentId: generatedDocs[0].document_id,
					documentNumber: generatedDocs[0].document_number,
					amount: generatedDocs[0].amount,
					type: generatedDocs[0].type as 'invoice' | 'estimate',
					status: generatedDocs[0].status as 'created' | 'sent' | 'cancelled',
					sentAt: generatedDocs[0].sent_at ? new Date(generatedDocs[0].sent_at) : null,
					createdAt: new Date(generatedDocs[0].created_at)
				}
			: null;

	return {
		id: job.id,
		userId: job.user_id,
		sourceDocumentId: job.source_document_id,
		sourceDocumentType: job.source_document_type,
		sourceTotal: job.source_total,
		sourceClientId: job.source_client_id,
		config: job.config,
		generatedDocument,
		status: job.status,
		createdAt: new Date(job.created_at),
		updatedAt: new Date(job.updated_at),
		completedAt: job.completed_at ? new Date(job.completed_at) : null
	};
}

// =============================================
// CANCEL TRANSFORM JOB
// =============================================

export async function cancelTransformJob(jobId: string): Promise<boolean> {
	const supabase = createClient();

	// Update job status
	const { error: jobError } = await supabase
		.from('transform_jobs')
		.update({ status: 'cancelled' })
		.eq('id', jobId);

	if (jobError) {
		console.error('Error cancelling transform job:', jobError);
		return false;
	}

	// Cancel generated document
	const { error: docsError } = await supabase
		.from('transform_generated_docs')
		.update({ status: 'cancelled' })
		.eq('transform_job_id', jobId);

	if (docsError) {
		console.error('Error cancelling generated document:', docsError);
	}

	return true;
}
