import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Generate a secure share token using Web Crypto API (Cloudflare compatible)
function generateShareToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	// Convert to base64url
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const supabase = locals.supabase;
	const userId = session.user.id;

	try {
		const { documentId, documentType } = await request.json();

		if (!documentId || !documentType) {
			return json({ error: 'Missing documentId or documentType' }, { status: 400 });
		}

		// Validate document type
		const validTypes = ['invoice', 'estimate', 'contract'];
		if (!validTypes.includes(documentType)) {
			return json({ error: 'Invalid document type' }, { status: 400 });
		}

		// Verify document exists and belongs to user
		const tableName = documentType === 'contract' ? 'contracts' : 'invoices';
		const { data: document, error: docError } = await supabase
			.from(tableName)
			.select('id, user_id')
			.eq('id', documentId)
			.eq('user_id', userId)
			.single();

		if (docError || !document) {
			return json({ error: 'Document not found' }, { status: 404 });
		}

		// Check if a share token already exists for this document
		const { data: existingShare } = await supabase
			.from('sent_documents')
			.select('share_token')
			.eq('document_id', documentId)
			.eq('document_type', documentType)
			.eq('delivery_method', 'link')
			.not('share_token', 'is', null)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		let shareToken: string;

		if (existingShare?.share_token) {
			// Reuse existing token
			shareToken = existingShare.share_token;
		} else {
			// Generate new token
			shareToken = generateShareToken();

			// Store in sent_documents
			const { error: insertError } = await supabase.from('sent_documents').insert({
				user_id: userId,
				document_id: documentId,
				document_type: documentType,
				delivery_method: 'link',
				share_token: shareToken
			});

			if (insertError) {
				console.error('Failed to create share record:', insertError);
				return json({ error: 'Failed to create share link' }, { status: 500 });
			}
		}

		// Build the share URL
		const baseUrl = url.origin;
		const shareUrl = `${baseUrl}/view/${documentType}/${documentId}?token=${shareToken}`;

		return json({
			success: true,
			shareUrl,
			shareToken
		});
	} catch (error) {
		console.error('Share link error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
