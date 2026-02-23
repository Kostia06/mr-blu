import type { Env } from '../../types';

interface SupabaseRow {
  [key: string]: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function supabaseQuery(
  env: Env,
  path: string,
  options?: RequestInit,
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options?.headers || {}),
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  if (!token) {
    return jsonResponse({ error: 'Missing share token' }, 400);
  }

  // Find the sent_documents record by share_token
  const sentQuery = token && id
    ? `sent_documents?share_token=eq.${token}&document_id=eq.${id}&select=*&limit=1`
    : `sent_documents?share_token=eq.${token}&select=*&limit=1`;

  const sentResponse = await supabaseQuery(env, sentQuery);
  if (!sentResponse.ok) {
    return jsonResponse({ error: 'Document not found' }, 404);
  }

  const sentDocs = (await sentResponse.json()) as SupabaseRow[];
  if (sentDocs.length === 0) {
    return jsonResponse({ error: 'Invalid or expired share link' }, 404);
  }

  const sentDoc = sentDocs[0];
  const documentId = (sentDoc.document_id as string) || id;
  const documentType = (sentDoc.document_type as string) || type || 'invoice';

  if (!documentId) {
    return jsonResponse({ error: 'Document not found' }, 404);
  }

  // Mark as viewed (fire-and-forget)
  if (sentDoc.id) {
    supabaseQuery(
      env,
      `sent_documents?id=eq.${sentDoc.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          viewed_at: new Date().toISOString(),
          view_count: ((sentDoc.view_count as number) || 0) + 1,
        }),
        headers: { Prefer: 'return=minimal' },
      },
    ).catch(() => {});
  }

  // Fetch the document
  const table = documentType === 'contract' ? 'contracts' : 'documents';
  const docResponse = await supabaseQuery(
    env,
    `${table}?id=eq.${documentId}&select=*,clients(id,name,email,phone,address)&limit=1`,
  );

  if (!docResponse.ok) {
    return jsonResponse({ error: 'Failed to fetch document' }, 500);
  }

  const docs = (await docResponse.json()) as SupabaseRow[];
  if (docs.length === 0) {
    return jsonResponse({ error: 'Document not found' }, 404);
  }

  const doc = docs[0];

  // Fetch owner profile
  const userId = doc.user_id as string;
  let ownerProfile: SupabaseRow = {};
  if (userId) {
    const profileResponse = await supabaseQuery(
      env,
      `profiles?id=eq.${userId}&select=full_name,business_name,email,phone,address,website&limit=1`,
    );
    if (profileResponse.ok) {
      const profiles = (await profileResponse.json()) as SupabaseRow[];
      if (profiles.length > 0) ownerProfile = profiles[0];
    }
  }

  const client = doc.clients as SupabaseRow | null;
  const lineItems = (doc.line_items as Array<SupabaseRow>) || [];

  // Build the DocumentData shape the client expects
  const result = {
    id: doc.id,
    title: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} ${doc.document_number || ''}`.trim(),
    documentType,
    documentNumber: doc.document_number || '',
    client: {
      name: (client?.name as string) || '',
      email: (client?.email as string) || '',
      phone: (client?.phone as string) || '',
      address: (client?.address as string) || '',
    },
    from: {
      name: (ownerProfile.full_name as string) || null,
      businessName: (ownerProfile.business_name as string) || '',
      email: (ownerProfile.email as string) || null,
      phone: (ownerProfile.phone as string) || null,
      address: (ownerProfile.address as string) || '',
      website: (ownerProfile.website as string) || '',
    },
    lineItems: lineItems.map((item) => ({
      description: (item.description as string) || '',
      quantity: (item.quantity as number) || 1,
      unit: (item.unit as string) || 'unit',
      rate: (item.rate as number) || 0,
      total: (item.total as number) || 0,
      measurementType: (item.measurementType as string) || undefined,
      dimensions: (item.dimensions as string) || undefined,
    })),
    subtotal: (doc.subtotal as number) || 0,
    taxRate: (doc.tax_rate as number) || 0,
    taxAmount: (doc.tax_amount as number) || 0,
    total: (doc.total as number) || 0,
    date: (doc.created_at as string) || '',
    dueDate: (doc.due_date as string) || undefined,
    notes: (doc.notes as string) || undefined,
    status: (doc.status as string) || 'sent',
  };

  return jsonResponse(result);
};
