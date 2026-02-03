import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const session = await locals.getSession();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const type = url.searchParams.get('type') as 'invoice' | 'estimate' | null;
	if (!type || !['invoice', 'estimate'].includes(type)) {
		return json({ error: 'Invalid type' }, { status: 400 });
	}

	const prefix = type === 'estimate' ? 'EST' : 'INV';
	const year = new Date().getFullYear();
	const pattern = `${prefix}-${year}-%`;

	const { data: existingDocs } = await locals.supabase
		.from('invoices')
		.select('invoice_number')
		.eq('user_id', session.user.id)
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

	return json({ number: `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}` });
};
