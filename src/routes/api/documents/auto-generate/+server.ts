import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractEntities } from '$lib/openai/extract-entities';
import { generateDocument } from '$lib/openai/generate-document';
import { generateDocumentNumber } from '$lib/services/transform';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	try {
		const session = locals.session;
		if (!session) throw error(401, 'Unauthorized');

		const { transcript } = await request.json();

		if (!transcript) {
			throw error(400, 'Transcript is required');
		}

		const env = platform?.env;
		const apiKey = env?.OPENAI_API_KEY || 'mock';

		// Get user profile
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id)
			.single();

		// Extract entities from transcript
		const entities = await extractEntities(transcript, apiKey);

		// Find or create client
		let client: {
			id?: string;
			name: string;
			email: string | null;
			phone: string | null;
			address: string | null;
		} = { name: 'New Client', email: null, phone: null, address: null };

		if (entities.clientName) {
			const { data: existing } = await locals.supabase
				.from('clients')
				.select('*')
				.eq('user_id', session.user.id)
				.ilike('name', `%${entities.clientName}%`)
				.limit(1)
				.single();

			if (existing) {
				client = existing;
			} else {
				const { data: newClient } = await locals.supabase
					.from('clients')
					.insert({
						user_id: session.user.id,
						name: entities.clientName,
						email: entities.clientEmail,
						phone: entities.clientPhone,
						address: entities.clientAddress
					})
					.select()
					.single();

				if (newClient) {
					client = newClient;
				}
			}
		}

		// Generate document content
		const documentData = await generateDocument(
			transcript,
			entities,
			profile || {
				full_name: 'Contractor',
				business_name: null,
				phone: null,
				email: session.user.email || ''
			},
			client,
			apiKey
		);

		// Save to database
		const table = entities.documentType === 'invoice' ? 'invoices' : 'contracts';

		const insertData =
			entities.documentType === 'invoice'
				? {
						user_id: session.user.id,
						client_id: client.id || null,
						invoice_number:
							(documentData as any).invoiceNumber ||
							(await generateDocumentNumber(locals.supabase, session.user.id, 'invoice')),
						title: (documentData as any).title,
						line_items: (documentData as any).lineItems || [],
						subtotal: (documentData as any).subtotal || 0,
						tax_rate: (documentData as any).taxRate || 0,
						tax_amount: (documentData as any).taxAmount || 0,
						total: (documentData as any).total || 0,
						due_date: (documentData as any).dueDate,
						notes: (documentData as any).notes,
						status: 'draft',
						original_transcript: transcript
					}
				: {
						user_id: session.user.id,
						client_id: client.id || null,
						title: (documentData as any).title,
						content: documentData,
						status: 'draft',
						original_transcript: transcript
					};

		const { data: savedDoc, error: saveError } = await locals.supabase
			.from(table)
			.insert(insertData)
			.select()
			.single();

		if (saveError) {
			console.error('Save error:', saveError);
			throw error(500, 'Failed to save document');
		}

		return json({
			id: savedDoc.id,
			type: entities.documentType,
			client,
			...documentData,
			total: (documentData as any).total || (documentData as any).amount || 0
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Auto-generate error:', err);
		return json({ error: 'Failed to auto-generate document' }, { status: 500 });
	}
};
