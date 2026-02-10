import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { incrementUsage, type UsageLimitInfo } from '$lib/server/usage-limits';
import { logger } from '$lib/server/logger';

interface TemplateDataInput {
	documentType: string;
	documentNumber: string;
	billTo: {
		name: string;
		address?: string | null;
		city?: string | null;
		phone?: string | null;
		email?: string | null;
	};
	from: {
		businessName?: string | null;
		address?: string | null;
		city?: string | null;
		phone?: string | null;
		email?: string | null;
	};
	items: Array<{
		id: string;
		description: string;
		unit: string;
		total: number;
		quantity?: number;
		rate?: number;
		measurementType?: string;
		dimensions?: string;
	}>;
	subtotal: number;
	gstRate: number;
	gstAmount: number;
	total: number;
	date: string;
	dueDate: string | null;
}

// Generate incremental document number for user
async function generateDocumentNumber(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	userId: string,
	documentType: 'invoice' | 'estimate'
): Promise<string> {
	const prefix = documentType === 'estimate' ? 'EST' : 'INV';
	const year = new Date().getFullYear();

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
		// Extract numbers and find the highest
		for (const doc of existingDocs) {
			const match = doc.invoice_number?.match(new RegExp(`${prefix}-${year}-(\\d+)`));
			if (match) {
				const num = parseInt(match[1], 10);
				if (num >= nextNumber) {
					nextNumber = num + 1;
				}
			}
		}
	}

	return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// Clean line items for database storage
function cleanLineItems(items: TemplateDataInput['items']) {
	return items.map((item) => {
		// Parse quantity from unit string if it's a number
		let quantity = 1;
		let rate = item.total;
		let unit = 'unit';

		// If we have explicit quantity/rate, use them
		if (typeof item.quantity === 'number' && !isNaN(item.quantity)) {
			quantity = item.quantity;
		}
		if (typeof item.rate === 'number' && !isNaN(item.rate)) {
			rate = item.rate;
		}

		// Clean the unit field - extract just a simple value
		if (item.unit && typeof item.unit === 'string') {
			// If unit is just a number, use it as quantity
			const numericUnit = parseFloat(item.unit);
			if (!isNaN(numericUnit) && item.unit.trim() === String(numericUnit)) {
				quantity = numericUnit;
				unit = 'unit';
			} else {
				// Try to extract base unit (first clean word)
				const cleanWord = item.unit
					.replace(/[\d@$,.\s]+/g, ' ')
					.trim()
					.split(/\s+/)[0];
				if (cleanWord && cleanWord !== 'null' && cleanWord.length > 0) {
					unit = cleanWord;
				}
			}
		}

		return {
			id: item.id || '',
			description: item.description || '',
			quantity,
			unit,
			rate,
			total: typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0,
			measurementType: item.measurementType || undefined,
			dimensions: item.dimensions || undefined
		};
	});
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		console.error('Save document: No authenticated user');
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const body = await request.json();
		const {
			templateData,
			originalTranscript,
			status = 'draft',
			clientMergeDecision
		} = body as {
			templateData: TemplateDataInput;
			originalTranscript?: string;
			status?: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';
			clientMergeDecision?: 'keep' | 'use_new' | 'update';
		};

		// Find or create client
		let clientId: string | null = null;
		let useNewDataOnly = false; // Flag to use new data for this document only

		if (templateData.billTo.name) {
			// Try to find existing client by name
			const { data: existingClient, error: findError } = await supabase
				.from('clients')
				.select('*')
				.eq('user_id', userId)
				.ilike('name', templateData.billTo.name)
				.maybeSingle();

			if (findError) {
				console.error('Error finding client:', findError);
			}

			if (existingClient) {
				// Check for conflicts (different data for existing fields)
				const differences: Array<{ field: string; old: string | null; new: string | null }> = [];

				if (
					templateData.billTo.email &&
					existingClient.email &&
					templateData.billTo.email.toLowerCase() !== existingClient.email.toLowerCase()
				) {
					differences.push({
						field: 'email',
						old: existingClient.email,
						new: templateData.billTo.email
					});
				}
				if (
					templateData.billTo.phone &&
					existingClient.phone &&
					templateData.billTo.phone !== existingClient.phone
				) {
					differences.push({
						field: 'phone',
						old: existingClient.phone,
						new: templateData.billTo.phone
					});
				}
				if (
					templateData.billTo.address &&
					existingClient.address &&
					templateData.billTo.address.toLowerCase() !== existingClient.address.toLowerCase()
				) {
					differences.push({
						field: 'address',
						old: existingClient.address,
						new: templateData.billTo.address
					});
				}

				// If there are conflicts and no decision provided, return conflict response
				if (differences.length > 0 && !clientMergeDecision) {
					return json({
						clientConflict: true,
						existingClient: {
							id: existingClient.id,
							name: existingClient.name,
							email: existingClient.email,
							phone: existingClient.phone,
							address: existingClient.address
						},
						newData: templateData.billTo,
						differences,
						success: false
					});
				}

				clientId = existingClient.id;

				// Handle based on decision
				if (clientMergeDecision === 'keep') {
					// Keep existing data, don't update anything
				} else if (clientMergeDecision === 'use_new') {
					// Use new data for this document only (don't update client record)
					useNewDataOnly = true;
				} else if (clientMergeDecision === 'update') {
					// Update client record with new data
					const updates: Record<string, string | null> = {};
					if (templateData.billTo.email) updates.email = templateData.billTo.email;
					if (templateData.billTo.phone) updates.phone = templateData.billTo.phone;
					if (templateData.billTo.address) updates.address = templateData.billTo.address;

					if (Object.keys(updates).length > 0) {
						const { error: updateError } = await supabase
							.from('clients')
							.update(updates)
							.eq('id', existingClient.id);
						if (updateError) {
							console.error('Error updating client:', updateError);
						}
					}
				} else {
					// No conflict or no decision needed - fill in missing fields only
					const updates: Record<string, string | null> = {};
					if (templateData.billTo.email && !existingClient.email)
						updates.email = templateData.billTo.email;
					if (templateData.billTo.phone && !existingClient.phone)
						updates.phone = templateData.billTo.phone;
					if (templateData.billTo.address && !existingClient.address)
						updates.address = templateData.billTo.address;

					if (Object.keys(updates).length > 0) {
						const { error: updateError } = await supabase
							.from('clients')
							.update(updates)
							.eq('id', existingClient.id);
						if (updateError) {
							console.error('Error updating client:', updateError);
						}
					}
				}
			} else {
				// Create new client
				const { data: newClient, error: clientError } = await supabase
					.from('clients')
					.insert({
						user_id: userId,
						name: templateData.billTo.name,
						email: templateData.billTo.email || null,
						phone: templateData.billTo.phone || null,
						address: templateData.billTo.address || null
					})
					.select()
					.single();

				if (clientError) {
					console.error('Error creating client:', clientError);
				} else if (newClient) {
					clientId = newClient.id;
				}
			}
		}

		// Determine document type
		const docType = templateData.documentType.toLowerCase();
		const documentType = docType === 'estimate' ? 'estimate' : 'invoice';

		// Generate incremental document number server-side
		const generatedDocNumber = await generateDocumentNumber(supabase, userId, documentType);

		// Clean line items before saving (removes any accumulated garbage in unit field)
		const cleanedItems = cleanLineItems(templateData.items);

		// Base document data (required fields only)
		const baseDocumentData = {
			user_id: userId,
			client_id: clientId,
			invoice_number: generatedDocNumber,
			title: `${templateData.documentType} for ${templateData.billTo.name || 'Client'}`,
			line_items: cleanedItems,
			subtotal: templateData.subtotal,
			tax_rate: templateData.gstRate * 100, // Convert to percentage
			tax_amount: templateData.gstAmount,
			total: templateData.total,
			due_date: templateData.dueDate,
			notes: null,
			status,
			original_transcript: originalTranscript || null
		};

		// Try with document_type first (requires migration)
		let document = null;
		let error = null;

		// First attempt: with document_type column
		const fullDocumentData = {
			...baseDocumentData,
			document_type: documentType,
			pdf_url: null
		};

		const result1 = await supabase.from('invoices').insert(fullDocumentData).select().single();

		if (result1.error) {
			// If column doesn't exist, try without document_type and pdf_url
			if (
				result1.error.message?.includes('document_type') ||
				result1.error.message?.includes('pdf_url') ||
				result1.error.code === '42703'
			) {
				// Column doesn't exist, retry without it
				const result2 = await supabase.from('invoices').insert(baseDocumentData).select().single();
				document = result2.data;
				error = result2.error;
			} else {
				error = result1.error;
			}
		} else {
			document = result1.data;
		}

		if (error) {
			console.error('Error saving document to database:', error);
			return json(
				{
					error: `Database error: ${error.message}`,
					details: error,
					success: false
				},
				{ status: 500 }
			);
		}

		// Track usage and get limit info
		let usageInfo: { usage: UsageLimitInfo; message?: string } | null = null;
		try {
			const usageResult = await incrementUsage(
				supabase,
				userId,
				documentType as 'invoice' | 'estimate' | 'contract'
			);
			usageInfo = {
				usage: usageResult.usage,
				message: usageResult.message
			};
		} catch (err) {
			console.error('Error tracking usage:', err);
		}

		return json({
			success: true,
			data: document,
			clientCreated: clientId !== null,
			usage: usageInfo?.usage || null,
			limitMessage: usageInfo?.message || null
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('document_save', err.message, {
			stack: err.stack,
			user_id: locals.session?.user?.id,
			request_path: '/api/documents/save',
			request_method: 'POST'
		});
		return json(
			{
				error: err.message || 'Failed to save document',
				success: false
			},
			{ status: 500 }
		);
	}
};
