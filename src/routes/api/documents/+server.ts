import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		if (!locals.session) {
			throw error(401, 'Unauthorized');
		}

		const body = await request.json();
		const { type, client_name, client_email, line_items, notes } = body;

		// Generate document number
		const prefix = type === 'invoice' ? 'INV' : 'EST';
		const year = new Date().getFullYear();
		const pattern = `${prefix}-${year}-%`;
		const { data: existingDocs } = await locals.supabase
			.from('invoices')
			.select('invoice_number')
			.eq('user_id', locals.user!.id)
			.like('invoice_number', pattern)
			.order('invoice_number', { ascending: false })
			.limit(10);

		let nextNumber = 1;
		if (existingDocs && existingDocs.length > 0) {
			for (const doc of existingDocs) {
				const match = doc.invoice_number?.match(new RegExp(`${prefix}-${year}-(\\d+)`));
				if (match) {
					const num = parseInt(match[1], 10);
					if (num >= nextNumber) nextNumber = num + 1;
				}
			}
		}
		const document_number = `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;

		// Calculate totals
		const subtotal = line_items.reduce(
			(sum: number, item: { quantity: number; unit_price: number }) =>
				sum + item.quantity * item.unit_price,
			0
		);

		// Find or create client
		let clientId: string | null = null;
		if (client_name) {
			const { data: existingClient } = await locals.supabase
				.from('clients')
				.select('id')
				.eq('user_id', locals.user!.id)
				.ilike('name', client_name)
				.maybeSingle();

			if (existingClient) {
				clientId = existingClient.id;
			} else {
				const { data: newClient } = await locals.supabase
					.from('clients')
					.insert({
						user_id: locals.user!.id,
						name: client_name,
						email: client_email || null
					})
					.select('id')
					.single();

				clientId = newClient?.id || null;
			}
		}

		// Create document
		const { data: doc, error: insertError } = await locals.supabase
			.from('invoices')
			.insert({
				user_id: locals.user!.id,
				document_type: type,
				invoice_number: document_number,
				client_id: clientId,
				title: `${type === 'invoice' ? 'Invoice' : 'Estimate'} for ${client_name || 'Client'}`,
				notes,
				subtotal,
				total: subtotal,
				status: 'draft',
				line_items: line_items.map(
					(item: { description: string; quantity: number; unit_price: number }) => ({
						description: item.description,
						quantity: item.quantity,
						rate: item.unit_price,
						total: item.quantity * item.unit_price
					})
				)
			})
			.select()
			.single();

		if (insertError) {
			throw error(500, insertError.message);
		}

		return json(doc, { status: 201 });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Document creation error:', err);
		return json({ error: 'Failed to create document' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		if (!locals.session) {
			throw error(401, 'Unauthorized');
		}

		const type = url.searchParams.get('type') || 'all';
		const status = url.searchParams.get('status');
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = 20;

		let query = locals.supabase
			.from('invoices')
			.select('*, clients(name, email)', { count: 'exact' })
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.range((page - 1) * limit, page * limit - 1);

		if (type !== 'all') {
			query = query.eq('document_type', type);
		}
		if (status) {
			query = query.eq('status', status);
		}

		const { data, count, error: queryError } = await query;

		if (queryError) {
			throw error(500, queryError.message);
		}

		return json({
			documents: data ?? [],
			total: count ?? 0,
			page,
			totalPages: Math.ceil((count ?? 0) / limit)
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		console.error('Document list error:', err);
		return json({ error: 'Failed to fetch documents' }, { status: 500 });
	}
};
