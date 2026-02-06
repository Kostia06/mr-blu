import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	executeTransform,
	findSourceDocumentByClient,
	findSimilarClients,
	type TransformConfig
} from '$lib/services/transform';
import { logger } from '$lib/server/logger';

// POST /api/transform - Execute a transform
export const POST: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const config: TransformConfig = await request.json();

		// Validate required fields
		if (!config.sourceDocumentId || !config.sourceDocumentType) {
			return json({ error: 'Missing source document information' }, { status: 400 });
		}

		// Execute the transform with server-side supabase client
		const result = await executeTransform(config, locals.supabase, session.user.id);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({
			success: true,
			job: result.job,
			generatedDocument: result.generatedDocument
		});
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		logger.error('transform', err.message, {
			stack: err.stack,
			user_id: locals.session?.user?.id,
			request_path: '/api/transform',
			request_method: 'POST'
		});
		return json(
			{ error: err.message || 'Transform failed' },
			{ status: 500 }
		);
	}
};

// GET /api/transform?clientName=...&documentType=...&selector=... - Find source document
export const GET: RequestHandler = async ({ url, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientName = url.searchParams.get('clientName');
	const documentType = url.searchParams.get('documentType') as 'invoice' | 'estimate' | null;
	const selector = url.searchParams.get('selector') as 'last' | 'latest' | 'recent' | null;

	if (!clientName) {
		return json({ error: 'Client name is required' }, { status: 400 });
	}

	try {
		// Pass server-side supabase client and user ID
		const sourceDoc = await findSourceDocumentByClient(
			clientName,
			documentType,
			selector,
			locals.supabase,
			session.user.id
		);

		if (!sourceDoc) {
			// Get suggestions for similar clients
			const suggestions = await findSimilarClients(clientName, locals.supabase, session.user.id);

			return json(
				{
					success: false,
					error: 'client_not_found',
					message: `No ${documentType || 'documents'} found for "${clientName}"`,
					searchedClient: clientName,
					searchedDocumentType: documentType,
					suggestions: suggestions
				},
				{ status: 404 }
			);
		}

		return json({
			success: true,
			sourceDocument: sourceDoc
		});
	} catch (error) {
		console.error('Find source document error:', error);
		return json(
			{
				success: false,
				error: 'server_error',
				message: error instanceof Error ? error.message : 'Failed to find document'
			},
			{ status: 500 }
		);
	}
};
