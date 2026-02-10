import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateSimilarity, findSimilarItems } from '$lib/utils/phonetic';

interface DocumentResult {
	id: string;
	type: 'invoice' | 'estimate' | 'contract';
	title: string;
	client: string;
	clientId: string | null;
	clientEmail: string | null;
	clientPhone: string | null;
	amount: number;
	date: string;
	status: string;
	lineItems?: Array<{
		description: string;
		quantity: number;
		unit: string;
		rate: number;
		total: number;
	}>;
}

interface ClientSuggestion {
	id: string;
	name: string;
	similarity: number;
}

// POST - Search for documents (for cloning/referencing)
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const { clientName, documentType, limit = 10 } = await request.json();

		const documents: DocumentResult[] = [];

		// Fetch invoices/estimates
		if (!documentType || documentType === 'invoice' || documentType === 'estimate') {
			const { data: invoices } = await supabase
				.from('invoices')
				.select(
					'id, title, invoice_number, client_id, total, status, created_at, document_type, line_items, clients(id, name, email, phone)'
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(50);

			for (const doc of invoices || []) {
				// Handle clients as potential array from Supabase join
				const clientData = doc.clients as
					| { id: string; name: string; email?: string; phone?: string }
					| { id: string; name: string; email?: string; phone?: string }[]
					| null;
				const client = Array.isArray(clientData) ? clientData[0] : clientData;
				const docClientName = client?.name || 'Unknown';

				// Filter by client name if specified
				if (clientName) {
					const similarity = calculateSimilarity(clientName, docClientName);
					if (similarity < 0.5) continue;
				}

				// Filter by document type if specified
				const docType = doc.document_type === 'estimate' ? 'estimate' : 'invoice';
				if (documentType && documentType !== docType) continue;

				documents.push({
					id: doc.id,
					type: docType,
					title: doc.title || doc.invoice_number || 'Untitled',
					client: docClientName,
					clientId: doc.client_id,
					clientEmail: client?.email || null,
					clientPhone: client?.phone || null,
					amount: doc.total || 0,
					date: doc.created_at,
					status: doc.status || 'draft',
					lineItems: doc.line_items as DocumentResult['lineItems']
				});
			}
		}

		// Fetch contracts
		if (!documentType || documentType === 'contract') {
			const { data: contracts } = await supabase
				.from('contracts')
				.select(
					'id, title, client_id, status, created_at, content, clients(id, name, email, phone)'
				)
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(20);

			for (const doc of contracts || []) {
				// Handle clients as potential array from Supabase join
				const clientData = doc.clients as
					| { id: string; name: string; email?: string; phone?: string }
					| { id: string; name: string; email?: string; phone?: string }[]
					| null;
				const client = Array.isArray(clientData) ? clientData[0] : clientData;
				const docClientName = client?.name || 'Unknown';

				// Filter by client name if specified
				if (clientName) {
					const similarity = calculateSimilarity(clientName, docClientName);
					if (similarity < 0.5) continue;
				}

				documents.push({
					id: doc.id,
					type: 'contract',
					title: doc.title || 'Untitled Contract',
					client: docClientName,
					clientId: doc.client_id,
					clientEmail: client?.email || null,
					clientPhone: client?.phone || null,
					amount: 0,
					date: doc.created_at,
					status: doc.status || 'draft'
				});
			}
		}

		// Sort by date and limit
		documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
		const limitedDocuments = documents.slice(0, limit);

		// Check if we found multiple matches for the same client
		const uniqueClients = new Set(limitedDocuments.map((d) => d.client.toLowerCase()));
		const needsSelection = clientName && limitedDocuments.length > 1;

		// Fetch all clients for suggestions when searching by name
		let clientSuggestions: ClientSuggestion[] = [];
		if (clientName) {
			const { data: allClients } = await supabase
				.from('clients')
				.select('id, name')
				.eq('user_id', userId);

			if (allClients && allClients.length > 0) {
				clientSuggestions = findSimilarItems(allClients, clientName, (c) => c.name)
					.filter((m) => m.item.name.toLowerCase() !== clientName.toLowerCase())
					.map((m) => ({ id: m.item.id, name: m.item.name, similarity: m.similarity }));
			}
		}

		return json({
			success: true,
			documents: limitedDocuments,
			needsSelection,
			searchedFor: clientName,
			uniqueClients: uniqueClients.size,
			// Include suggestions for speech-to-text corrections
			suggestions:
				clientSuggestions.length > 0
					? {
							type: 'client',
							searchedFor: clientName,
							alternatives: clientSuggestions
						}
					: undefined
		});
	} catch (error) {
		console.error('Document search error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
