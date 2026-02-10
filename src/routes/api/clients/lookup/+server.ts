import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateSimilarity } from '$lib/utils/phonetic';

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
