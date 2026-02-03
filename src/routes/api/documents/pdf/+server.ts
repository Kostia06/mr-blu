import { json, type RequestHandler } from '@sveltejs/kit';
import { generatePDFFromSource } from '$lib/templates/pdf-server';
import type { DocumentSourceData } from '$lib/templates/types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	try {
		const body = await request.json();
		const { shareToken, ...documentData } = body as DocumentSourceData & { shareToken?: string };

		// Allow access if authenticated OR if a valid share token is provided
		const session = locals.session;
		if (!session?.user && !shareToken) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Validate share token if no session
		if (!session?.user && shareToken) {
			const { data: shareRecord } = await locals.supabase
				.from('sent_documents')
				.select('id')
				.eq('share_token', shareToken)
				.single();

			if (!shareRecord) {
				return json({ error: 'Invalid share token' }, { status: 403 });
			}
		}

		if (!documentData.documentType || !documentData.lineItems) {
			return json({ error: 'Missing required document data' }, { status: 400 });
		}

		const pdfBuffer = await generatePDFFromSource(documentData, platform!.env.MYBROWSER);

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${documentData.documentType}-${documentData.documentNumber || 'document'}.pdf"`
			}
		});
	} catch (err) {
		console.error('PDF generation failed:', err);
		return json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
};
