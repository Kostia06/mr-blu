import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const session = locals.session;
	if (!session) {
		throw redirect(303, '/login');
	}

	const documentId = params.id;
	const docType = url.searchParams.get('type') || 'invoice';

	// Fetch user profile for "From" section
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('full_name, business_name, email, phone, address')
		.eq('id', session.user.id)
		.single();

	// Fallback: derive full name from user_metadata if profile.full_name is empty
	if (profile && !profile.full_name) {
		const meta = session.user.user_metadata;
		if (meta?.first_name && meta?.last_name) {
			profile.full_name = `${meta.first_name} ${meta.last_name}`;
		} else if (meta?.first_name || meta?.last_name) {
			profile.full_name = meta.first_name || meta.last_name;
		}
	}

	// Fetch document based on type
	if (docType === 'contract') {
		const { data: contract, error: fetchError } = await locals.supabase
			.from('contracts')
			.select('*, clients(name, email, phone, address)')
			.eq('id', documentId)
			.eq('user_id', session.user.id)
			.single();

		if (fetchError || !contract) {
			throw error(404, 'Contract not found');
		}

		return {
			document: {
				...contract,
				type: 'contract',
				documentType: 'contract',
				client: (contract.clients as any)?.name || 'Unknown Client',
				clientDetails: contract.clients
			},
			profile
		};
	} else {
		// Fetch invoice or estimate
		const { data: invoice, error: fetchError } = await locals.supabase
			.from('invoices')
			.select('*, clients(name, email, phone, address)')
			.eq('id', documentId)
			.eq('user_id', session.user.id)
			.single();

		if (fetchError || !invoice) {
			throw error(404, 'Document not found');
		}

		const type = invoice.document_type === 'estimate' ? 'estimate' : 'invoice';

		return {
			document: {
				...invoice,
				type,
				documentType: invoice.document_type || 'invoice',
				client: (invoice.clients as any)?.name || 'Unknown Client',
				clientDetails: invoice.clients
			},
			profile
		};
	}
};
