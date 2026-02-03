import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { MeasurementType } from '$lib/parsing/types';

// Create a service role client for public access (bypasses RLS)
const getServiceClient = () => {
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
	}
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

interface DocumentData {
	id: string;
	title: string;
	documentType: string;
	documentNumber: string;
	client: {
		name: string;
		email?: string;
		phone?: string;
		address?: string;
	};
	from: {
		name?: string;
		businessName?: string;
		email?: string;
		phone?: string;
		address?: string;
	};
	lineItems: Array<{
		description: string;
		quantity?: number;
		unit: string;
		rate?: number;
		total: number;
		measurementType?: MeasurementType;
		dimensions?: string;
	}>;
	subtotal: number;
	taxRate: number;
	taxAmount: number;
	total: number;
	date: string;
	dueDate?: string;
	notes?: string;
	status: string;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const { type, id } = params;
	const token = url.searchParams.get('token');

	// Validate type
	const validTypes = ['invoice', 'estimate', 'contract'];
	if (!validTypes.includes(type)) {
		throw error(404, 'Invalid document type');
	}

	// Validate token presence
	if (!token) {
		throw error(403, 'Access denied. A valid share token is required.');
	}

	const supabase = getServiceClient();

	// Verify the share token
	const { data: shareRecord, error: shareError } = await supabase
		.from('sent_documents')
		.select('*')
		.eq('document_id', id)
		.eq('share_token', token)
		.single();

	if (shareError || !shareRecord) {
		throw error(403, 'Invalid or expired share link');
	}

	// Mark as viewed if first time
	if (!shareRecord.viewed_at) {
		await supabase
			.from('sent_documents')
			.update({ viewed_at: new Date().toISOString() })
			.eq('id', shareRecord.id);
	}

	// Fetch the document
	const tableName = type === 'contract' ? 'contracts' : 'invoices';
	const { data: doc, error: docError } = await supabase
		.from(tableName)
		.select(
			`
			*,
			clients (
				name,
				email,
				phone,
				address
			)
		`
		)
		.eq('id', id)
		.single();

	if (docError || !doc) {
		throw error(404, 'Document not found');
	}

	// Fetch the owner's profile for "from" info
	const { data: profile } = await supabase
		.from('profiles')
		.select('full_name, business_name, email, phone, address')
		.eq('id', doc.user_id)
		.single();

	// Fetch user auth data to get first_name, last_name, email, phone from user_metadata
	const { data: authData } = await supabase.auth.admin.getUserById(doc.user_id);
	const userMeta = authData?.user?.user_metadata;
	const userFullName =
		userMeta?.first_name && userMeta?.last_name
			? `${userMeta.first_name} ${userMeta.last_name}`
			: userMeta?.first_name || userMeta?.last_name || null;

	// Get contact info from profile or auth user
	const userEmail = profile?.email || authData?.user?.email || null;
	const userPhone = profile?.phone || userMeta?.phone || null;

	// Transform to standard format
	const document: DocumentData = {
		id: doc.id,
		title:
			doc.title || `${type.charAt(0).toUpperCase() + type.slice(1)} ${doc.invoice_number || ''}`,
		documentType: type.toUpperCase(),
		documentNumber: doc.invoice_number || '',
		client: {
			name: doc.clients?.name || 'Client',
			email: doc.clients?.email,
			phone: doc.clients?.phone,
			address: doc.clients?.address
		},
		from: {
			name: profile?.full_name || userFullName || null,
			businessName: profile?.business_name || '',
			email: userEmail,
			phone: userPhone,
			address: profile?.address
		},
		lineItems: (doc.line_items || []).map((item: Record<string, unknown>) => {
			// Handle dimensions - convert old object format to string if needed
			let dimensionsStr: string | undefined;
			if (item.dimensions) {
				if (typeof item.dimensions === 'string') {
					dimensionsStr = item.dimensions;
				} else {
					const dims = item.dimensions as Record<string, unknown>;
					if (dims.width != null && dims.length != null) {
						const unit = dims.unit || 'ft';
						dimensionsStr = `${dims.width} × ${dims.length} ${unit}`;
					}
				}
			}

			return {
				description: String(item.description || ''),
				quantity: Number(item.quantity) || 1,
				unit: String(item.unit || 'unit'),
				rate: Number(item.rate) || 0,
				total: Number(item.total) || 0,
				measurementType: (item.measurementType as MeasurementType) || 'unit',
				dimensions: dimensionsStr
			};
		}),
		subtotal: Number(doc.subtotal) || 0,
		taxRate: Number(doc.tax_rate) || 0,
		taxAmount: Number(doc.tax_amount) || 0,
		total: Number(doc.total) || 0,
		date: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : '',
		dueDate: doc.due_date,
		notes: doc.notes || undefined,
		status: doc.status || 'draft'
	};

	return {
		document,
		shareToken: token
	};
};
