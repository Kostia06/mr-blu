import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateSimilarity } from '$lib/utils/phonetic';

interface ClientSuggestion {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	address: string | null;
	similarity: number;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// SECURITY: Check authentication
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const { name, limit = 5 } = await request.json();

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required', success: false }, { status: 400 });
		}

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
				suggestions: [],
				exactMatch: null
			});
		}

		// Find similar clients
		const suggestions: ClientSuggestion[] = [];
		let exactMatch: ClientSuggestion | null = null;

		for (const client of clients) {
			const similarity = calculateSimilarity(name, client.name);

			// Check for exact match (case-insensitive)
			if (name.toLowerCase().trim() === client.name.toLowerCase().trim()) {
				exactMatch = {
					id: client.id,
					name: client.name,
					email: client.email,
					phone: client.phone,
					address: client.address,
					similarity: 1
				};
			} else if (similarity >= 0.3) {
				// Lower threshold for speech-to-text errors
				suggestions.push({
					id: client.id,
					name: client.name,
					email: client.email,
					phone: client.phone,
					address: client.address,
					similarity
				});
			}
		}

		// Sort by similarity and limit
		suggestions.sort((a, b) => b.similarity - a.similarity);
		const limitedSuggestions = suggestions.slice(0, limit);

		return json({
			success: true,
			suggestions: limitedSuggestions,
			exactMatch,
			searchedFor: name
		});
	} catch (error) {
		console.error('Client suggestion error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get suggestions'
			},
			{ status: 500 }
		);
	}
};
