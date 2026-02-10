import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findSimilarItems } from '$lib/utils/phonetic';

interface QueryParams {
	type: 'list' | 'sum' | 'count' | 'details';
	documentTypes: string[];
	clientName: string | null;
	status: string | null;
	dateRange: {
		start: string | null;
		end: string | null;
		period: string | null;
	};
	sortBy: string | null;
	limit: number | null;
}

interface Document {
	id: string;
	type: string;
	documentType: string;
	title: string;
	client: string;
	clientId: string | null;
	date: string;
	amount: number;
	status: string;
	dueDate?: string | null;
}

interface ClientSuggestion {
	id: string;
	name: string;
	similarity: number;
}

// Calculate date range from period string
function getDateRangeFromPeriod(period: string): { start: Date; end: Date } {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (period) {
		case 'today':
			return { start: today, end: now };
		case 'yesterday': {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			return { start: yesterday, end: today };
		}
		case 'this_week': {
			const weekStart = new Date(today);
			weekStart.setDate(today.getDate() - today.getDay());
			return { start: weekStart, end: now };
		}
		case 'last_week': {
			const lastWeekEnd = new Date(today);
			lastWeekEnd.setDate(today.getDate() - today.getDay());
			const lastWeekStart = new Date(lastWeekEnd);
			lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
			return { start: lastWeekStart, end: lastWeekEnd };
		}
		case 'this_month': {
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			return { start: monthStart, end: now };
		}
		case 'last_month': {
			const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
			return { start: lastMonthStart, end: lastMonthEnd };
		}
		case 'this_year': {
			const yearStart = new Date(now.getFullYear(), 0, 1);
			return { start: yearStart, end: now };
		}
		default:
			return { start: new Date(0), end: now };
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// SECURITY: Check authentication - only authenticated users can query
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const body = await request.json();
		const query: QueryParams = body.query;

		if (!query || !query.type) {
			return json({ error: 'Invalid query parameters', success: false }, { status: 400 });
		}

		// SECURITY: All queries are scoped to the authenticated user's data only
		const allDocuments: Document[] = [];
		let clientSuggestions: ClientSuggestion[] = [];
		const searchedClientName = query.clientName;

		// Fetch all clients for fuzzy matching if client name is specified
		let allClients: { id: string; name: string }[] = [];
		if (query.clientName) {
			const { data: clients } = await supabase
				.from('clients')
				.select('id, name')
				.eq('user_id', userId);
			allClients = clients || [];
		}

		// Determine date range
		let dateStart: Date | null = null;
		let dateEnd: Date | null = null;

		if (query.dateRange?.period) {
			const range = getDateRangeFromPeriod(query.dateRange.period);
			dateStart = range.start;
			dateEnd = range.end;
		} else if (query.dateRange?.start || query.dateRange?.end) {
			dateStart = query.dateRange.start ? new Date(query.dateRange.start) : null;
			dateEnd = query.dateRange.end ? new Date(query.dateRange.end) : null;
		}

		// Fetch invoices/estimates if requested
		if (query.documentTypes.includes('invoice') || query.documentTypes.includes('estimate')) {
			let invoiceQuery = supabase
				.from('invoices')
				.select(
					'id, title, invoice_number, client_id, total, status, created_at, document_type, due_date, clients(id, name)'
				)
				.eq('user_id', userId); // SECURITY: Scoped to user

			// Filter by document type
			if (query.documentTypes.includes('invoice') && !query.documentTypes.includes('estimate')) {
				invoiceQuery = invoiceQuery.or('document_type.eq.invoice,document_type.is.null');
			} else if (
				query.documentTypes.includes('estimate') &&
				!query.documentTypes.includes('invoice')
			) {
				invoiceQuery = invoiceQuery.eq('document_type', 'estimate');
			}

			// Filter by status
			if (query.status) {
				invoiceQuery = invoiceQuery.eq('status', query.status);
			}

			// Filter by date range
			if (dateStart) {
				invoiceQuery = invoiceQuery.gte('created_at', dateStart.toISOString());
			}
			if (dateEnd) {
				invoiceQuery = invoiceQuery.lte('created_at', dateEnd.toISOString());
			}

			// Apply limit
			if (query.limit) {
				invoiceQuery = invoiceQuery.limit(query.limit);
			}

			// Sort
			if (query.sortBy === 'amount') {
				invoiceQuery = invoiceQuery.order('total', { ascending: false });
			} else if (query.sortBy === 'client') {
				invoiceQuery = invoiceQuery.order('client_id', { ascending: true });
			} else {
				invoiceQuery = invoiceQuery.order('created_at', { ascending: false });
			}

			const { data: invoices, error: invoiceError } = await invoiceQuery;

			if (invoiceError) {
				console.error('Invoice query error:', invoiceError);
			} else if (invoices) {
				for (const doc of invoices) {
					const clientName = (doc.clients as any)?.name || 'Unknown Client';

					// Filter by client name if specified
					if (
						query.clientName &&
						!clientName.toLowerCase().includes(query.clientName.toLowerCase())
					) {
						continue;
					}

					allDocuments.push({
						id: doc.id,
						type: doc.document_type === 'estimate' ? 'estimate' : 'invoice',
						documentType: doc.document_type || 'invoice',
						title: doc.title || doc.invoice_number || 'Untitled',
						client: clientName,
						clientId: doc.client_id,
						date: doc.created_at,
						amount: doc.total || 0,
						status: doc.status || 'draft',
						dueDate: doc.due_date
					});
				}
			}
		}

		// Fetch contracts if requested
		if (query.documentTypes.includes('contract')) {
			let contractQuery = supabase
				.from('contracts')
				.select('id, title, client_id, status, created_at, clients(id, name)')
				.eq('user_id', userId); // SECURITY: Scoped to user

			// Filter by status
			if (query.status) {
				contractQuery = contractQuery.eq('status', query.status);
			}

			// Filter by date range
			if (dateStart) {
				contractQuery = contractQuery.gte('created_at', dateStart.toISOString());
			}
			if (dateEnd) {
				contractQuery = contractQuery.lte('created_at', dateEnd.toISOString());
			}

			// Apply limit
			if (query.limit) {
				contractQuery = contractQuery.limit(query.limit);
			}

			contractQuery = contractQuery.order('created_at', { ascending: false });

			const { data: contracts, error: contractError } = await contractQuery;

			if (contractError) {
				console.error('Contract query error:', contractError);
			} else if (contracts) {
				for (const doc of contracts) {
					const clientName = (doc.clients as any)?.name || 'Unknown Client';

					// Filter by client name if specified
					if (
						query.clientName &&
						!clientName.toLowerCase().includes(query.clientName.toLowerCase())
					) {
						continue;
					}

					allDocuments.push({
						id: doc.id,
						type: 'contract',
						documentType: 'contract',
						title: doc.title || 'Untitled Contract',
						client: clientName,
						clientId: doc.client_id,
						date: doc.created_at,
						amount: 0,
						status: doc.status || 'draft'
					});
				}
			}
		}

		// Sort combined results
		allDocuments.sort((a, b) => {
			if (query.sortBy === 'amount') {
				return b.amount - a.amount;
			} else if (query.sortBy === 'client') {
				return a.client.localeCompare(b.client);
			}
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		});

		// Apply final limit if needed
		const limitedDocuments = query.limit ? allDocuments.slice(0, query.limit) : allDocuments;

		// Always find similar client names when searching by client
		// This helps correct speech-to-text errors like "Kos" -> "calls"/"Cost"/"Coles"
		if (query.clientName && allClients.length > 0) {
			clientSuggestions = findSimilarItems(allClients, query.clientName, (c) => c.name)
				.filter((m) => m.item.name.toLowerCase() !== query.clientName?.toLowerCase())
				.map((m) => ({ id: m.item.id, name: m.item.name, similarity: m.similarity }));
		}

		// Generate response based on query type
		let response: {
			success: boolean;
			queryType: string;
			documents?: Document[];
			summary?: {
				count: number;
				totalAmount: number;
				byStatus: Record<string, number>;
				byType: Record<string, number>;
			};
			answer?: string;
			suggestions?: {
				type: 'client';
				searchedFor: string;
				alternatives: ClientSuggestion[];
			};
		};

		switch (query.type) {
			case 'list':
				response = {
					success: true,
					queryType: 'list',
					documents: limitedDocuments,
					answer:
						limitedDocuments.length > 0
							? `Found ${limitedDocuments.length} document${limitedDocuments.length !== 1 ? 's' : ''}.`
							: clientSuggestions.length > 0
								? `No documents found for "${searchedClientName}". Did you mean one of these clients?`
								: 'No documents found matching your criteria.'
				};
				if (clientSuggestions.length > 0) {
					response.suggestions = {
						type: 'client',
						searchedFor: searchedClientName || '',
						alternatives: clientSuggestions
					};
				}
				break;

			case 'count':
				response = {
					success: true,
					queryType: 'count',
					answer:
						limitedDocuments.length > 0
							? `You have ${limitedDocuments.length} document${limitedDocuments.length !== 1 ? 's' : ''} matching your criteria.`
							: clientSuggestions.length > 0
								? `No documents found for "${searchedClientName}". Did you mean one of these clients?`
								: 'No documents found matching your criteria.',
					summary: {
						count: limitedDocuments.length,
						totalAmount: limitedDocuments.reduce((sum, d) => sum + d.amount, 0),
						byStatus: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.status] = (acc[d.status] || 0) + 1;
								return acc;
							},
							{} as Record<string, number>
						),
						byType: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.type] = (acc[d.type] || 0) + 1;
								return acc;
							},
							{} as Record<string, number>
						)
					}
				};
				if (clientSuggestions.length > 0) {
					response.suggestions = {
						type: 'client',
						searchedFor: searchedClientName || '',
						alternatives: clientSuggestions
					};
				}
				break;

			case 'sum':
				const totalAmount = limitedDocuments.reduce((sum, d) => sum + d.amount, 0);
				const formattedAmount = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD'
				}).format(totalAmount);

				response = {
					success: true,
					queryType: 'sum',
					answer:
						limitedDocuments.length > 0
							? `Total amount: ${formattedAmount} across ${limitedDocuments.length} document${limitedDocuments.length !== 1 ? 's' : ''}.`
							: clientSuggestions.length > 0
								? `No documents found for "${searchedClientName}". Did you mean one of these clients?`
								: 'No documents found matching your criteria.',
					summary: {
						count: limitedDocuments.length,
						totalAmount,
						byStatus: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.status] = (acc[d.status] || 0) + d.amount;
								return acc;
							},
							{} as Record<string, number>
						),
						byType: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.type] = (acc[d.type] || 0) + d.amount;
								return acc;
							},
							{} as Record<string, number>
						)
					},
					documents: limitedDocuments
				};
				if (clientSuggestions.length > 0) {
					response.suggestions = {
						type: 'client',
						searchedFor: searchedClientName || '',
						alternatives: clientSuggestions
					};
				}
				break;

			case 'details':
				response = {
					success: true,
					queryType: 'details',
					documents: limitedDocuments,
					summary: {
						count: limitedDocuments.length,
						totalAmount: limitedDocuments.reduce((sum, d) => sum + d.amount, 0),
						byStatus: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.status] = (acc[d.status] || 0) + 1;
								return acc;
							},
							{} as Record<string, number>
						),
						byType: limitedDocuments.reduce(
							(acc, d) => {
								acc[d.type] = (acc[d.type] || 0) + 1;
								return acc;
							},
							{} as Record<string, number>
						)
					}
				};
				if (clientSuggestions.length > 0) {
					response.suggestions = {
						type: 'client',
						searchedFor: searchedClientName || '',
						alternatives: clientSuggestions
					};
				}
				break;

			default:
				response = {
					success: true,
					queryType: 'list',
					documents: limitedDocuments
				};
		}

		return json(response);
	} catch (error) {
		console.error('Info query error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to execute query'
			},
			{ status: 500 }
		);
	}
};
