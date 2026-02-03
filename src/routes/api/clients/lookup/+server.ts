import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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

// Calculate similarity score (0-1, higher is better)
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase().trim();
	const s2 = str2.toLowerCase().trim();

	// Exact match
	if (s1 === s2) return 1;

	// Check if one contains the other
	if (s1.includes(s2) || s2.includes(s1)) return 0.9;

	// Check word-by-word matching (for full names vs first name)
	const words1 = s1.split(/\s+/);
	const words2 = s2.split(/\s+/);

	// If searching for a single word, check if it matches any word in the full name
	if (words2.length === 1) {
		for (const w1 of words1) {
			if (w1 === s2) return 0.95; // First name exact match
			const wordSim = 1 - levenshteinDistance(w1, s2) / Math.max(w1.length, s2.length);
			if (wordSim > 0.8) return wordSim * 0.9;
		}
	}

	// Levenshtein-based similarity
	const maxLen = Math.max(s1.length, s2.length);
	const distance = levenshteinDistance(s1, s2);
	return 1 - distance / maxLen;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	// SECURITY: Check authentication
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	const name = url.searchParams.get('name');
	if (!name) {
		return json({ error: 'Name parameter is required', success: false }, { status: 400 });
	}

	try {
		// Fetch all clients for this user
		const { data: clients, error } = await supabase
			.from('clients')
			.select('id, name, email, phone, address')
			.eq('user_id', userId);

		if (error) {
			console.error('Client fetch error:', error);
			return json({ error: 'Failed to fetch clients', success: false }, { status: 500 });
		}

		if (!clients || clients.length === 0) {
			return json({
				success: true,
				client: null,
				message: 'No clients found'
			});
		}

		// Find the best matching client
		let bestMatch: {
			id: string;
			name: string;
			email: string | null;
			phone: string | null;
			address: string | null;
			similarity: number;
		} | null = null;

		for (const client of clients) {
			const similarity = calculateSimilarity(client.name, name);

			// Only consider matches with similarity >= 0.5
			if (similarity >= 0.5 && (!bestMatch || similarity > bestMatch.similarity)) {
				bestMatch = {
					id: client.id,
					name: client.name,
					email: client.email,
					phone: client.phone,
					address: client.address,
					similarity
				};
			}
		}

		const cacheHeaders = {
			headers: {
				'Cache-Control': 'private, max-age=120, stale-while-revalidate=300'
			}
		};

		if (bestMatch && bestMatch.similarity >= 0.7) {
			// Good match found
			return json(
				{
					success: true,
					client: {
						id: bestMatch.id,
						name: bestMatch.name,
						email: bestMatch.email,
						phone: bestMatch.phone,
						address: bestMatch.address
					},
					confidence: bestMatch.similarity
				},
				cacheHeaders
			);
		} else if (bestMatch) {
			// Possible match but low confidence
			return json(
				{
					success: true,
					client: {
						id: bestMatch.id,
						name: bestMatch.name,
						email: bestMatch.email,
						phone: bestMatch.phone,
						address: bestMatch.address
					},
					confidence: bestMatch.similarity,
					needsConfirmation: true,
					message: `Found possible match: ${bestMatch.name}. Did you mean this client?`
				},
				cacheHeaders
			);
		}

		return json(
			{
				success: true,
				client: null,
				message: `No client found matching "${name}"`
			},
			cacheHeaders
		);
	} catch (error) {
		console.error('Client lookup error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to lookup client'
			},
			{ status: 500 }
		);
	}
};
