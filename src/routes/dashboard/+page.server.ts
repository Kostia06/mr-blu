import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, user } = locals;

	if (!user) {
		throw redirect(303, '/login');
	}

	// Run all queries in parallel for better performance
	const [invoicesResult, contractsResult, allInvoicesResult, pendingReviewResult] =
		await Promise.all([
			// Fetch recent invoices/estimates (limit to 3)
			supabase
				.from('invoices')
				.select(
					'id, title, invoice_number, client_id, total, status, created_at, document_type, clients(name)'
				)
				.eq('user_id', user!.id)
				.order('created_at', { ascending: false })
				.limit(3),
			// Fetch recent contracts (limit to 3)
			supabase
				.from('contracts')
				.select('id, title, client_id, status, created_at, clients(name)')
				.eq('user_id', user!.id)
				.order('created_at', { ascending: false })
				.limit(3),
			// Get quick stats
			supabase.from('invoices').select('total, status, document_type').eq('user_id', user!.id),
			// Fetch most recent pending/in_progress review session
			supabase
				.from('review_sessions')
				.select(
					'id, status, intent_type, summary, created_at, parsed_data, original_transcript, actions'
				)
				.eq('user_id', user!.id)
				.in('status', ['pending', 'in_progress'])
				.order('updated_at', { ascending: false })
				.limit(1)
				.maybeSingle()
		]);

	const invoices = invoicesResult.data;
	const contracts = contractsResult.data;
	const allInvoices = allInvoicesResult.data;
	const pendingReview = pendingReviewResult.data;

	// Combine and sort by date
	const recentDocuments = [
		...(invoices || []).map((doc) => ({
			id: doc.id,
			type: doc.document_type === 'estimate' ? 'Estimate' : 'Invoice',
			documentType: doc.document_type || 'invoice',
			title: doc.title || doc.invoice_number || 'Untitled',
			client: (doc.clients as any)?.name || 'Unknown Client',
			date: doc.created_at,
			amount: doc.total || 0,
			status: doc.status || 'draft'
		})),
		...(contracts || []).map((doc) => ({
			id: doc.id,
			type: 'Contract',
			documentType: 'contract',
			title: doc.title || 'Untitled Contract',
			client: (doc.clients as any)?.name || 'Unknown Client',
			date: doc.created_at,
			amount: 0,
			status: doc.status || 'draft'
		}))
	]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 3);

	const stats = {
		totalDocuments: (invoices?.length || 0) + (contracts?.length || 0),
		totalInvoiced: (allInvoices || [])
			.filter((i) => i.document_type !== 'estimate')
			.reduce((sum, i) => sum + (i.total || 0), 0),
		paidAmount: (allInvoices || [])
			.filter((i) => i.status === 'paid' && i.document_type !== 'estimate')
			.reduce((sum, i) => sum + (i.total || 0), 0),
		pendingCount: (allInvoices || []).filter(
			(i) => ['sent', 'pending'].includes(i.status) && i.document_type !== 'estimate'
		).length
	};

	return {
		recentDocuments,
		stats,
		pendingReview
	};
};
