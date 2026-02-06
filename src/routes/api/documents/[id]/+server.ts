import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET - Fetch a single document with full details
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const documentId = params.id;
	const table = url.searchParams.get('table') || 'invoices';

	// Validate table name
	if (!['invoices', 'contracts'].includes(table)) {
		return json({ error: 'Invalid table name', success: false }, { status: 400 });
	}

	try {
		const { data: document, error } = await supabase
			.from(table)
			.select('*')
			.eq('id', documentId)
			.eq('user_id', userId)
			.single();

		if (error || !document) {
			return json({ error: 'Document not found', success: false }, { status: 404 });
		}

		return json({ success: true, document });
	} catch (error) {
		console.error('Get document error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch document',
				success: false
			},
			{ status: 500 }
		);
	}
};

// PATCH - Update a document (all editable fields)
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const documentId = params.id;

	try {
		const body = await request.json();
		const {
			table = 'invoices',
			type,
			invoice_number,
			client_name,
			client_details,
			line_items,
			subtotal,
			tax_rate,
			tax_amount,
			total,
			due_date,
			notes
		} = body;

		// Validate table name
		if (!['invoices', 'contracts'].includes(table)) {
			return json({ error: 'Invalid table name', success: false }, { status: 400 });
		}

		// First verify the document belongs to this user and get client_id
		const { data: existing, error: checkError } = await supabase
			.from(table)
			.select('id, client_id')
			.eq('id', documentId)
			.eq('user_id', userId)
			.single();

		if (checkError || !existing) {
			return json({ error: 'Document not found or unauthorized', success: false }, { status: 404 });
		}

		// Update client details in the clients table if provided
		if (client_details && existing.client_id) {
			const clientUpdates: Record<string, string | null> = {};
			if (client_details.email !== undefined) clientUpdates.email = client_details.email;
			if (client_details.phone !== undefined) clientUpdates.phone = client_details.phone;
			if (client_details.address !== undefined) clientUpdates.address = client_details.address;
			if (client_name !== undefined) clientUpdates.name = client_name;

			if (Object.keys(clientUpdates).length > 0) {
				const { error: clientUpdateError } = await supabase
					.from('clients')
					.update(clientUpdates)
					.eq('id', existing.client_id)
					.eq('user_id', userId);

				if (clientUpdateError) {
					console.error('Update client error:', clientUpdateError);
					// Don't fail the whole request, just log the error
				}
			}
		}

		// Update the document with all provided fields
		const updateData: Record<string, unknown> = {
			updated_at: new Date().toISOString()
		};

		// document_type is the actual column name for invoice/estimate
		if (type !== undefined) updateData.document_type = type;
		if (invoice_number !== undefined) updateData.invoice_number = invoice_number;
		// Update the title to reflect the client name
		if (client_name !== undefined) updateData.title = `${type || 'Invoice'} for ${client_name}`;
		// Note: 'client' column doesn't exist on invoices table - client data is in clients table via client_id
		if (line_items !== undefined) updateData.line_items = line_items;
		if (subtotal !== undefined) updateData.subtotal = subtotal;
		if (tax_rate !== undefined) updateData.tax_rate = tax_rate;
		if (tax_amount !== undefined) updateData.tax_amount = tax_amount;
		if (total !== undefined) updateData.total = total;
		if (due_date !== undefined) updateData.due_date = due_date;
		if (notes !== undefined) updateData.notes = notes;

		const { data: updated, error: updateError } = await supabase
			.from(table)
			.update(updateData)
			.eq('id', documentId)
			.eq('user_id', userId)
			.select()
			.single();

		if (updateError) {
			console.error('Update document error:', updateError);
			return json({ error: 'Failed to update document', success: false }, { status: 500 });
		}

		return json({ success: true, document: updated });
	} catch (error) {
		console.error('Update document error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to update document',
				success: false
			},
			{ status: 500 }
		);
	}
};

// DELETE - Delete a document
export const DELETE: RequestHandler = async ({ params, url, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;
	const documentId = params.id;
	const type = url.searchParams.get('type') || 'invoice';

	// Determine table based on type
	const table = type === 'contract' ? 'contracts' : 'invoices';

	try {
		// First verify the document belongs to this user
		const { data: existing, error: checkError } = await supabase
			.from(table)
			.select('id')
			.eq('id', documentId)
			.eq('user_id', userId)
			.single();

		if (checkError || !existing) {
			return json({ error: 'Document not found or unauthorized', success: false }, { status: 404 });
		}

		// Delete associated sent_documents records first (foreign key constraint)
		await supabase.from('sent_documents').delete().eq('document_id', documentId);

		// Delete the document
		const { error: deleteError } = await supabase
			.from(table)
			.delete()
			.eq('id', documentId)
			.eq('user_id', userId);

		if (deleteError) {
			console.error('Delete document error:', deleteError);
			return json({ error: 'Failed to delete document', success: false }, { status: 500 });
		}

		return json({ success: true, message: 'Document deleted successfully' });
	} catch (error) {
		console.error('Delete document error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to delete document',
				success: false
			},
			{ status: 500 }
		);
	}
};
