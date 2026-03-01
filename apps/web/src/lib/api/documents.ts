import { supabase } from '@/lib/supabase/client';
import { calculateSimilarity } from '@/lib/utils/phonetic';
import type { MeasurementType } from '@/lib/parsing/types';

// =============================================
// TYPES
// =============================================

interface DocumentRecord {
  id: string;
  [key: string]: unknown;
}

interface ClientDetails {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  name?: string;
}

interface SearchParams {
  clientName?: string;
  documentType?: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: number;
  date: string;
  status: string;
  documentNumber?: string;
  lineItems?: Array<Record<string, unknown>>;
  createdAt: string;
  similarity?: number;
  [key: string]: unknown;
}

interface RecentDocumentRecord {
  id: string;
  document_number: string;
  client_name: string;
  total: number;
  created_at: string;
  document_type: string;
  clients?: { name: string } | null;
}

interface ShareResult {
  shareUrl: string;
  shareToken: string;
}

interface SaveDocumentOptions {
  originalTranscript?: string;
  status?: 'draft' | 'sent';
  clientMergeDecision?: 'keep' | 'use_new' | 'update';
}

interface SaveDocumentResult {
  id: string;
  clientConflict?: boolean;
  existingClient?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  differences?: Array<{ field: string; old: string | null; new: string | null }>;
}

// =============================================
// FETCH DOCUMENT
// =============================================

export async function fetchDocument(
  id: string,
  table = 'documents'
): Promise<DocumentRecord> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new DocumentApiError(`Failed to fetch document: ${error.message}`);
  }

  return data;
}

// =============================================
// UPDATE DOCUMENT
// =============================================

export async function updateDocument(
  id: string,
  updates: Record<string, unknown>,
  table = 'documents'
): Promise<DocumentRecord> {
  const { client_details, ...documentUpdates } = updates;

  if (client_details && documentUpdates.client_id) {
    const clientId = documentUpdates.client_id as string;
    const details = client_details as ClientDetails;

    await supabase
      .from('clients')
      .update({
        ...(details.email !== undefined && { email: details.email }),
        ...(details.phone !== undefined && { phone: details.phone }),
        ...(details.address !== undefined && { address: details.address }),
        ...(details.name !== undefined && { name: details.name }),
      })
      .eq('id', clientId);
  }

  const { data, error } = await supabase
    .from(table)
    .update(documentUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DocumentApiError(`Failed to update document: ${error.message}`);
  }

  return data;
}

// =============================================
// DELETE DOCUMENT
// =============================================

export async function deleteDocument(
  id: string,
  type: string
): Promise<void> {
  await supabase
    .from('sent_documents')
    .delete()
    .eq('document_id', id);

  const table = type === 'contract' ? 'contracts' : 'documents';

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    throw new DocumentApiError(`Failed to delete document: ${error.message}`);
  }
}

// =============================================
// SEARCH DOCUMENTS
// =============================================

export async function searchDocuments(
  params: SearchParams
): Promise<{ documents: SearchResult[]; suggestions?: { alternatives: Array<{ name: string; similarity: number }> } }> {
  const { clientName, documentType, limit = 10 } = params;

  const invoiceQuery = supabase
    .from('documents')
    .select(`
      id, document_type, document_number, client_id,
      total, subtotal, tax_rate, tax_amount, line_items, notes,
      due_date, status, created_at,
      clients (id, name, email, phone, address)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (documentType && documentType !== 'contract') {
    invoiceQuery.eq('document_type', documentType);
  }

  const { data: invoices, error: invoiceError } = await invoiceQuery;

  if (invoiceError) {
    throw new DocumentApiError(`Search failed: ${invoiceError.message}`);
  }

  const allDocs: SearchResult[] = (invoices || []).map((doc) => {
    const client = doc.clients as unknown as { id: string; name: string; email?: string; phone?: string; address?: string } | null;
    return {
      id: doc.id,
      type: doc.document_type,
      title: doc.document_number || '',
      client: client?.name || '',
      clientId: client?.id || doc.client_id || '',
      clientEmail: client?.email || '',
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',
      amount: doc.total,
      date: doc.created_at,
      status: doc.status || 'draft',
      documentNumber: doc.document_number,
      lineItems: doc.line_items,
      createdAt: doc.created_at,
      subtotal: doc.subtotal,
      taxRate: doc.tax_rate,
      taxAmount: doc.tax_amount,
      notes: doc.notes,
      dueDate: doc.due_date,
    };
  });

  if (!clientName) {
    return { documents: allDocs.slice(0, limit) };
  }

  const scored = allDocs.map((doc) => ({
    ...doc,
    similarity: calculateSimilarity(clientName, doc.client),
  }));

  const matched = scored
    .filter((doc) => doc.similarity >= 0.3)
    .sort((a, b) => {
      if (b.similarity !== a.similarity) return b.similarity - a.similarity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);

  const alternatives = matched.length === 0
    ? scored
        .filter((doc) => doc.similarity >= 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map((doc) => ({ name: doc.client, similarity: doc.similarity }))
    : [];

  return {
    documents: matched,
    suggestions: alternatives.length > 0 ? { alternatives } : undefined,
  };
}

// =============================================
// FETCH RECENT DOCUMENTS
// =============================================

export async function fetchRecentDocuments(): Promise<RecentDocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, document_number, total, created_at, document_type, clients (name)')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw new DocumentApiError(`Failed to fetch recent documents: ${error.message}`);
  }

  return (data || []).map((doc) => ({
    id: doc.id,
    document_number: doc.document_number || '',
    client_name: (doc.clients as unknown as { name: string } | null)?.name || '',
    total: doc.total,
    created_at: doc.created_at,
    document_type: doc.document_type,
  }));
}

// =============================================
// GENERATE NEXT NUMBER
// =============================================

export async function generateNextNumber(
  type: 'invoice' | 'estimate'
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === 'invoice' ? 'INV' : 'EST';
  const pattern = `${prefix}-${year}-%`;

  const { data: existingDocs } = await supabase
    .from('documents')
    .select('document_number')
    .like('document_number', pattern)
    .order('document_number', { ascending: false })
    .limit(10);

  let nextNumber = 1;

  if (existingDocs && existingDocs.length > 0) {
    for (const doc of existingDocs) {
      const match = doc.document_number?.match(
        new RegExp(`${prefix}-${year}-(\\d+)`)
      );
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNumber) nextNumber = num + 1;
      }
    }
  }

  return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// =============================================
// SHARE DOCUMENT
// =============================================

export async function shareDocument(
  documentId: string,
  documentType: string
): Promise<ShareResult> {
  const { data: existing } = await supabase
    .from('sent_documents')
    .select('share_token')
    .eq('document_id', documentId)
    .not('share_token', 'is', null)
    .limit(1)
    .single();

  if (existing?.share_token) {
    const shareUrl = `${window.location.origin}/view/${existing.share_token}`;
    return { shareUrl, shareToken: existing.share_token };
  }

  const shareToken = crypto.randomUUID();

  const { error } = await supabase
    .from('sent_documents')
    .insert({
      document_id: documentId,
      document_type: documentType,
      share_token: shareToken,
      method: 'link',
    });

  if (error) {
    throw new DocumentApiError(`Failed to create share link: ${error.message}`);
  }

  const shareUrl = `${window.location.origin}/view/${shareToken}`;
  return { shareUrl, shareToken };
}

// =============================================
// SAVE DOCUMENT (complex)
// =============================================

export async function saveDocument(
  templateData: Record<string, unknown>,
  options: SaveDocumentOptions = {}
): Promise<SaveDocumentResult> {
  const { originalTranscript, status = 'draft', clientMergeDecision } = options;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new DocumentApiError('Not authenticated');
  }

  const billTo = templateData.billTo as Record<string, unknown> | undefined;
  const clientName = (billTo?.name as string) || '';
  const clientEmail = (billTo?.email as string) || null;
  const clientPhone = (billTo?.phone as string) || null;
  const clientAddress = (billTo?.address as string) || null;

  let clientId: string | null = null;

  if (clientName) {
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id, name, email, phone, address')
      .eq('user_id', user.id)
      .ilike('name', clientName)
      .limit(1);

    const existingClient = existingClients?.[0];

    if (existingClient) {
      if (!clientMergeDecision) {
        const differences = buildClientDifferences(existingClient, {
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
        });

        if (differences.length > 0) {
          return {
            id: '',
            clientConflict: true,
            existingClient,
            newData: { name: clientName, email: clientEmail, phone: clientPhone, address: clientAddress },
            differences,
          };
        }
      }

      if (clientMergeDecision === 'update' || clientMergeDecision === 'use_new') {
        await supabase
          .from('clients')
          .update({
            ...(clientEmail && { email: clientEmail }),
            ...(clientPhone && { phone: clientPhone }),
            ...(clientAddress && { address: clientAddress }),
          })
          .eq('id', existingClient.id);
      }

      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          address: clientAddress,
        })
        .select('id')
        .single();

      if (clientError) {
        throw new DocumentApiError(`Failed to create client: ${clientError.message}`);
      }

      clientId = newClient.id;
    }
  }

  const documentType = ((templateData.documentType as string) || 'invoice').toLowerCase();
  const type = documentType === 'estimate' ? 'estimate' : 'invoice';
  const docNumber = (templateData.documentNumber as string) || await generateNextNumber(type);

  const items = templateData.items as Array<Record<string, unknown>> | undefined;
  const cleanedItems = (items || []).map((item) => ({
    description: item.description || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'unit',
    rate: item.rate || 0,
    total: item.total || 0,
    measurementType: item.measurementType || undefined,
    dimensions: item.dimensions || undefined,
    notes: item.notes || null,
  }));

  const { data: savedDoc, error: saveError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      client_id: clientId,
      document_type: type,
      document_number: docNumber,
      line_items: cleanedItems,
      subtotal: templateData.subtotal || 0,
      tax_rate: templateData.gstRate ? (templateData.gstRate as number) * 100 : 0,
      tax_amount: templateData.gstAmount || 0,
      total: templateData.total || 0,
      due_date: templateData.dueDate || null,
      notes: (templateData.notes as string) || null,
      status,
      original_transcript: originalTranscript || null,
    })
    .select('id')
    .single();

  if (saveError) {
    throw new DocumentApiError(`Failed to save document: ${saveError.message}`);
  }

  return { id: savedDoc.id };
}

// =============================================
// SEND DOCUMENT
// =============================================

export async function sendDocument(
  documentId: string,
  documentType: string,
  method: string,
  recipient: Record<string, unknown>,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  // Generate PDF client-side and convert to base64
  let pdfBase64: string | undefined;
  try {
    const docData = await fetchDocumentForPdf(documentId, documentType);
    if (docData) {
      const pdfBlob = await generatePDF(docData);
      const buffer = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      pdfBase64 = btoa(binary);
    }
  } catch (err) {
    console.error('PDF generation failed, sending without attachment:', err);
  }

  const { sendDocumentEmail } = await import('./external');
  return sendDocumentEmail({
    documentId,
    documentType,
    method,
    recipient: {
      email: (recipient.email as string) || '',
      name: (recipient.name as string) || undefined,
    },
    customMessage,
    pdfBase64,
  });
}

async function fetchDocumentForPdf(
  documentId: string,
  documentType: string,
): Promise<Record<string, unknown> | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const table = documentType === 'contract' ? 'contracts' : 'documents';
  const { data: doc, error } = await supabase
    .from(table)
    .select('*, clients(*)')
    .eq('id', documentId)
    .single();

  if (error || !doc) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const client = doc.clients as Record<string, unknown> | null;

  return {
    documentType: doc.document_type || documentType,
    documentNumber: doc.document_number || '',
    client: {
      name: client?.name || '',
      email: client?.email || null,
      phone: client?.phone || null,
      address: client?.address || null,
    },
    from: {
      name: profile?.full_name || null,
      businessName: profile?.business_name || null,
      email: profile?.email || null,
      phone: profile?.phone || null,
      address: profile?.address || null,
      website: profile?.website || null,
    },
    lineItems: (doc.line_items as Array<Record<string, unknown>>) || [],
    subtotal: doc.subtotal || 0,
    taxRate: doc.tax_rate || 0,
    taxAmount: doc.tax_amount || 0,
    total: doc.total || 0,
    date: doc.created_at || new Date().toISOString(),
    dueDate: doc.due_date || null,
    notes: doc.notes || null,
  };
}

// =============================================
// PDF GENERATION (client-side via jsPDF)
// =============================================

export async function generatePDF(
  documentData: Record<string, unknown>
): Promise<Blob> {
  const { renderDocumentHTML } = await import('@/lib/templates/render');
  const { jsPDF } = await import('jspdf');

  const type = ((documentData.documentType as string) || 'invoice').toLowerCase();
  const client = (documentData.client as Record<string, unknown>) || {};
  const from = (documentData.from as Record<string, unknown>) || {};
  const lineItems = (documentData.lineItems as Array<Record<string, unknown>>) || [];

  const sourceData = {
    documentType: type,
    documentNumber: (documentData.documentNumber as string) || '',
    client: {
      name: (client.name as string) || '',
      email: (client.email as string) || null,
      phone: (client.phone as string) || null,
      address: (client.address as string) || null,
    },
    from: {
      name: (from.name as string) || null,
      businessName: (from.businessName as string) || null,
      email: (from.email as string) || null,
      phone: (from.phone as string) || null,
      address: (from.address as string) || null,
      website: (from.website as string) || null,
    },
    lineItems: lineItems.map((item) => ({
      description: (item.description as string) || '',
      quantity: (item.quantity as number) || 1,
      unit: (item.unit as string) || 'unit',
      rate: (item.rate as number) || 0,
      total: (item.total as number) || 0,
      measurementType: item.measurementType as MeasurementType | undefined,
      dimensions: item.dimensions as string | undefined,
      notes: (item.notes as string) || '',
    })),
    subtotal: (documentData.subtotal as number) || 0,
    taxRate: (documentData.taxRate as number) || 0,
    taxAmount: (documentData.taxAmount as number) || 0,
    total: (documentData.total as number) || 0,
    date: (documentData.date as string) || new Date().toISOString(),
    dueDate: (documentData.dueDate as string) || null,
    notes: (documentData.notes as string) || null,
    paymentTerms: (documentData.paymentTerms as string) || null,
    terms: (documentData.terms as string) || null,
  };

  const html = renderDocumentHTML(sourceData, { forPdf: true });

  // Parse the full HTML document to extract styles and body content separately.
  // Setting a full HTML document as innerHTML of a div strips <html>/<head>/<body> tags
  // and loses the <style> block, causing blank PDF output.
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const styleContent = styleMatch ? styleMatch[0] : '';
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '-9999';
  container.innerHTML = styleContent + bodyContent;
  document.body.appendChild(container);

  try {
    const target = (container.querySelector('.document-template') || container) as HTMLElement;
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      width: 816,
      windowWidth: 816,
    });

    // Letter size in points: 612 x 792
    const pageWidthPt = 612;
    const pageHeightPt = 792;
    const scale = pageWidthPt / canvas.width;
    const scaledHeight = canvas.height * scale;
    const pageCount = Math.ceil(scaledHeight / pageHeightPt);

    const doc = new jsPDF({ format: 'letter', orientation: 'portrait', unit: 'pt' });

    for (let i = 0; i < pageCount; i++) {
      if (i > 0) doc.addPage();

      const sliceCanvas = window.document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(
        canvas.height - i * (pageHeightPt / scale),
        pageHeightPt / scale
      );

      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(
        canvas,
        0, i * (pageHeightPt / scale),
        canvas.width, sliceCanvas.height,
        0, 0,
        canvas.width, sliceCanvas.height,
      );

      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightPt = sliceCanvas.height * scale;
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidthPt, sliceHeightPt);
    }

    return doc.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

// =============================================
// HELPERS
// =============================================

function buildClientDifferences(
  existing: Record<string, unknown>,
  incoming: { email?: string | null; phone?: string | null; address?: string | null }
): Array<{ field: string; old: string | null; new: string | null }> {
  const differences: Array<{ field: string; old: string | null; new: string | null }> = [];

  if (incoming.email && incoming.email !== existing.email) {
    differences.push({
      field: 'email',
      old: (existing.email as string) || null,
      new: incoming.email,
    });
  }

  if (incoming.phone && incoming.phone !== existing.phone) {
    differences.push({
      field: 'phone',
      old: (existing.phone as string) || null,
      new: incoming.phone,
    });
  }

  if (incoming.address && incoming.address !== existing.address) {
    differences.push({
      field: 'address',
      old: (existing.address as string) || null,
      new: incoming.address,
    });
  }

  return differences;
}

// =============================================
// ERROR CLASS
// =============================================

export class DocumentApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentApiError';
  }
}
