import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

// Levenshtein distance
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
			dp[i][j] =
				str1[i - 1] === str2[j - 1]
					? dp[i - 1][j - 1]
					: 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
		}
	}
	return dp[m][n];
}

// Normalize first character for comparison
function normalizeFirstChar(char: string): string {
	if ('ckq'.includes(char)) return 'k';
	if ('sz'.includes(char)) return 's';
	if ('gj'.includes(char)) return 'g';
	if ('fvp'.includes(char)) return 'f';
	return char;
}

// Get consonant skeleton
function getConsonantSkeleton(str: string): string {
	return str
		.toLowerCase()
		.replace(/[aeiou]/g, '')
		.replace(/c/g, 'k')
		.replace(/ph/g, 'f')
		.replace(/ck/g, 'k')
		.replace(/(.)\1+/g, '$1');
}

// Get Soundex code
function getSoundexCode(str: string): string {
	if (!str) return '';
	const s = str.toLowerCase();
	let firstChar = s[0];
	if ('ckq'.includes(firstChar)) firstChar = 'k';
	if ('fvp'.includes(firstChar)) firstChar = 'f';
	if ('sz'.includes(firstChar)) firstChar = 's';
	if ('gj'.includes(firstChar)) firstChar = 'j';
	let code = firstChar;
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
		if ('aeiouhwy'.includes(char)) {
			lastCode = '';
			continue;
		}
		if (charCode && charCode !== lastCode) {
			code += charCode;
			lastCode = charCode;
		}
	}
	return (code + '000').slice(0, 4);
}

// Phonetic similarity
function getPhoneticSimilarity(s1: string, s2: string): number {
	const soundex1 = getSoundexCode(s1);
	const soundex2 = getSoundexCode(s2);
	if (soundex1 === soundex2) return 0.8;
	if (soundex1.slice(0, 3) === soundex2.slice(0, 3)) return 0.7;
	if (soundex1.slice(0, 2) === soundex2.slice(0, 2)) return 0.6;
	const skel1 = getConsonantSkeleton(s1);
	const skel2 = getConsonantSkeleton(s2);
	if (skel1 === skel2) return 0.75;
	if (skel1.includes(skel2) || skel2.includes(skel1)) return 0.65;
	return 0;
}

// Fuzzy matching for client names with improved phonetic support
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase().trim();
	const s2 = str2.toLowerCase().trim();
	if (s1 === s2) return 1;
	if (s1.includes(s2) || s2.includes(s1)) return 0.9;

	const firstLetterBonus = normalizeFirstChar(s1[0]) === normalizeFirstChar(s2[0]) ? 0.1 : 0;
	const phoneticScore = getPhoneticSimilarity(s1, s2);
	const distance = levenshteinDistance(s1, s2);
	const levenshteinScore = 1 - distance / Math.max(s1.length, s2.length);

	return Math.min(1, Math.max(levenshteinScore, phoneticScore) + firstLetterBonus);
}

// Find similar clients
function findSimilarClients(
	searchName: string,
	clients: { id: string; name: string }[],
	threshold: number = 0.3
): ClientSuggestion[] {
	const suggestions: ClientSuggestion[] = [];
	for (const client of clients) {
		const similarity = calculateSimilarity(searchName, client.name);
		if (similarity >= threshold && client.name.toLowerCase() !== searchName.toLowerCase()) {
			suggestions.push({ id: client.id, name: client.name, similarity });
		}
	}
	return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
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
				clientSuggestions = findSimilarClients(clientName, allClients);
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
