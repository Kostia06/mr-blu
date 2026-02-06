import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	const type = url.searchParams.get('type') || 'all';
	const statusFilter = url.searchParams.get('status') || null;
	const clientFilter = url.searchParams.get('client') || null;

	// Fetch contracts, invoices, and sent_documents in parallel
	const [contractsResult, invoicesResult, sentDocumentsResult] = await Promise.all([
		locals.supabase
			.from('contracts')
			.select('id, title, client_id, status, created_at, updated_at, clients(name, email)')
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('invoices')
			.select(
				'id, title, invoice_number, client_id, total, status, created_at, updated_at, document_type, due_date, line_items, subtotal, tax_rate, tax_amount, clients(name, email)'
			)
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('sent_documents')
			.select('document_id, created_at')
			.eq('user_id', session.user.id)
			.order('created_at', { ascending: false })
	]);

	const contracts = contractsResult.data;
	const invoices = invoicesResult.data;
	const sentDocuments = sentDocumentsResult.data;

	// Create a map of document_id to sent_at timestamp
	const sentAtMap = new Map<string, string>();
	if (sentDocuments) {
		for (const sent of sentDocuments) {
			// Only keep the first (most recent) sent_at for each document
			if (!sentAtMap.has(sent.document_id)) {
				sentAtMap.set(sent.document_id, sent.created_at);
			}
		}
	}

	// Transform and combine documents
	const allDocuments = [
		...(contracts || []).map((doc) => ({
			id: doc.id,
			type: 'contract' as const,
			documentType: 'contract' as const,
			title: doc.title || 'Untitled Contract',
			client: (doc.clients as any)?.name || 'Unknown Client',
			clientEmail: (doc.clients as any)?.email || null,
			date: doc.created_at,
			createdAt: doc.created_at,
			updatedAt: doc.updated_at || doc.created_at,
			sentAt: sentAtMap.get(doc.id) || null,
			status: doc.status || 'draft',
			amount: 0
		})),
		...(invoices || []).map((doc) => ({
			id: doc.id,
			type: (doc.document_type === 'estimate' ? 'estimate' : 'invoice') as 'estimate' | 'invoice',
			documentType: (doc.document_type || 'invoice') as 'estimate' | 'invoice',
			documentNumber: doc.invoice_number || null,
			title: doc.title || doc.invoice_number || 'Untitled',
			client: (doc.clients as any)?.name || 'Unknown Client',
			clientEmail: (doc.clients as any)?.email || null,
			date: doc.created_at,
			createdAt: doc.created_at,
			updatedAt: doc.updated_at || doc.created_at,
			sentAt: sentAtMap.get(doc.id) || null,
			amount: doc.total || 0,
			status: doc.status || 'draft',
			dueDate: doc.due_date,
			lineItems: doc.line_items || [],
			subtotal: doc.subtotal || 0,
			taxRate: doc.tax_rate || 0,
			taxAmount: doc.tax_amount || 0
		}))
	].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Calculate summaries
	const summaries = {
		totalInvoices: allDocuments.filter((d) => d.type === 'invoice').length,
		totalEstimates: allDocuments.filter((d) => d.type === 'estimate').length,
		totalContracts: allDocuments.filter((d) => d.type === 'contract').length,
		clients: [...new Set(allDocuments.map((d) => d.client).filter((c) => c !== 'Unknown Client'))]
	};

	return {
		documents: allDocuments,
		summaries,
		activeType: type,
		statusFilter,
		clientFilter
	};
};
