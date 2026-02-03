import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

// Calculate Levenshtein distance between two strings
function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1];
			} else {
				dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
			}
		}
	}
	return dp[m][n];
}

// Normalize first character for comparison (handles k/c, s/z, etc.)
function normalizeFirstChar(char: string): string {
	if ('ckq'.includes(char)) return 'k';
	if ('sz'.includes(char)) return 's';
	if ('gj'.includes(char)) return 'g';
	if ('fvp'.includes(char)) return 'f';
	return char;
}

// Calculate similarity score (0-1, higher is better)
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase();
	const s2 = str2.toLowerCase();

	// Exact match
	if (s1 === s2) return 1;

	// Check if one contains the other
	if (s1.includes(s2) || s2.includes(s1)) return 0.9;

	// Check if first letters match (normalized for phonetic similarity)
	const firstLetterBonus = normalizeFirstChar(s1[0]) === normalizeFirstChar(s2[0]) ? 0.1 : 0;

	// Check for common phonetic mistakes
	const phoneticScore = getPhoneticSimilarity(s1, s2);

	// Levenshtein-based similarity
	const maxLen = Math.max(s1.length, s2.length);
	const distance = levenshteinDistance(s1, s2);
	const levenshteinScore = 1 - distance / maxLen;

	// Combine scores
	return Math.min(1, Math.max(levenshteinScore, phoneticScore) + firstLetterBonus);
}

// Get consonant skeleton of a word (removes vowels, normalizes consonants)
function getConsonantSkeleton(str: string): string {
	return str
		.toLowerCase()
		.replace(/[aeiou]/g, '') // Remove all vowels
		.replace(/c/g, 'k') // c -> k
		.replace(/ph/g, 'f')
		.replace(/ck/g, 'k')
		.replace(/gh/g, '')
		.replace(/wh/g, 'w')
		.replace(/qu/g, 'kw')
		.replace(/x/g, 'ks')
		.replace(/(.)\1+/g, '$1'); // Remove double consonants
}

// Get Soundex-like code for phonetic matching
function getSoundexCode(str: string): string {
	if (!str) return '';
	const s = str.toLowerCase();

	// Normalize first letter (c/k sound the same, etc.)
	let firstChar = s[0];
	if (firstChar === 'c' || firstChar === 'k' || firstChar === 'q') firstChar = 'k';
	if (firstChar === 'f' || firstChar === 'v' || firstChar === 'p') firstChar = 'f';
	if (firstChar === 's' || firstChar === 'z') firstChar = 's';
	if (firstChar === 'g' || firstChar === 'j') firstChar = 'j';

	let code = firstChar;

	// Map consonants to numbers
	const map: Record<string, string> = {
		b: '1',
		f: '1',
		p: '1',
		v: '1',
		c: '2',
		g: '2',
		j: '2',
		k: '2',
		q: '2',
		s: '2',
		x: '2',
		z: '2',
		d: '3',
		t: '3',
		l: '4',
		m: '5',
		n: '5',
		r: '6'
	};

	let lastCode = map[s[0]] || '';

	for (let i = 1; i < s.length && code.length < 4; i++) {
		const char = s[i];
		const charCode = map[char] || '';

		// Skip vowels and 'h', 'w', 'y'
		if ('aeiouhwy'.includes(char)) {
			lastCode = ''; // Reset so next consonant is added
			continue;
		}

		// Skip if same code as previous (like double letters)
		if (charCode && charCode !== lastCode) {
			code += charCode;
			lastCode = charCode;
		}
	}

	// Pad with zeros
	return (code + '000').slice(0, 4);
}

// Check for common phonetic/speech-to-text mistakes
function getPhoneticSimilarity(s1: string, s2: string): number {
	// Common speech-to-text confusions
	const replacements: [RegExp, string][] = [
		[/ph/g, 'f'],
		[/ck/g, 'k'],
		[/gh/g, ''],
		[/tion/g, 'shun'],
		[/sion/g, 'shun'],
		[/ee/g, 'i'],
		[/ea/g, 'e'],
		[/oo/g, 'u'],
		[/ey/g, 'ee'],
		[/ie/g, 'ee'],
		[/y$/g, 'ee'],
		[/ll/g, 'l'],
		[/ss/g, 's'],
		[/tt/g, 't'],
		[/nn/g, 'n'],
		[/rr/g, 'r'],
		[/c([ei])/g, 's$1'],
		[/qu/g, 'kw'],
		[/x/g, 'ks']
	];

	let normalized1 = s1;
	let normalized2 = s2;

	for (const [pattern, replacement] of replacements) {
		normalized1 = normalized1.replace(pattern, replacement);
		normalized2 = normalized2.replace(pattern, replacement);
	}

	if (normalized1 === normalized2) return 0.85;

	// Soundex comparison - if codes match, high similarity
	const soundex1 = getSoundexCode(s1);
	const soundex2 = getSoundexCode(s2);
	if (soundex1 === soundex2) return 0.8;

	// Partial Soundex match (first 2-3 chars)
	if (soundex1.slice(0, 3) === soundex2.slice(0, 3)) return 0.7;
	if (soundex1.slice(0, 2) === soundex2.slice(0, 2)) return 0.6;

	// Consonant skeleton comparison
	const skel1 = getConsonantSkeleton(s1);
	const skel2 = getConsonantSkeleton(s2);
	if (skel1 === skel2) return 0.75;

	// Check if one skeleton contains the other (for added/dropped sounds)
	if (skel1.includes(skel2) || skel2.includes(skel1)) return 0.65;

	const maxLen = Math.max(normalized1.length, normalized2.length);
	const distance = levenshteinDistance(normalized1, normalized2);
	return 1 - distance / maxLen;
}

// Find similar client names
function findSimilarClients(
	searchName: string,
	clients: { id: string; name: string }[],
	threshold: number = 0.3 // Lower threshold to catch more speech-to-text errors
): ClientSuggestion[] {
	const suggestions: ClientSuggestion[] = [];

	for (const client of clients) {
		const similarity = calculateSimilarity(searchName, client.name);
		if (similarity >= threshold) {
			suggestions.push({
				id: client.id,
				name: client.name,
				similarity
			});
		}
	}

	// Sort by similarity (highest first) and limit to top 5
	return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
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
			clientSuggestions = findSimilarClients(query.clientName, allClients);
			// Filter out exact matches from suggestions
			clientSuggestions = clientSuggestions.filter(
				(s) => s.name.toLowerCase() !== query.clientName?.toLowerCase()
			);
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
