import { supabase } from '@/lib/supabase/client';
import { calculateSimilarity } from '@/lib/utils/phonetic';

const SIMILARITY_THRESHOLD = 0.3;
const MAX_CLIENT_SUGGESTIONS = 5;

export interface TransformConfig {
  sourceDocumentId: string;
  sourceDocumentType: 'invoice' | 'estimate';
  conversion: {
    enabled: boolean;
    targetType: 'invoice' | 'estimate';
  };
}

export interface TransformResult {
  success: boolean;
  job?: { id: string };
  generatedDocument?: { id: string };
  error?: string;
}

export interface SourceDocumentData {
  id: string;
  type: 'invoice' | 'estimate';
  number: string;
  total: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  createdAt: string;
}

export interface ClientSuggestion {
  id: string;
  name: string;
  estimateCount: number;
  invoiceCount: number;
  similarity: number;
}

export async function findSimilarClients(searchName: string): Promise<ClientSuggestion[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !clients?.length) return [];

  const suggestions: ClientSuggestion[] = [];

  for (const client of clients) {
    const { count: estimateCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('document_type', 'estimate');

    const { count: invoiceCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('document_type', 'invoice');

    if ((estimateCount || 0) > 0 || (invoiceCount || 0) > 0) {
      const similarity = calculateSimilarity(searchName, client.name);
      suggestions.push({
        id: client.id,
        name: client.name,
        estimateCount: estimateCount || 0,
        invoiceCount: invoiceCount || 0,
        similarity,
      });
    }
  }

  suggestions.sort((a, b) => b.similarity - a.similarity);

  return suggestions
    .filter((s) => s.similarity >= SIMILARITY_THRESHOLD)
    .slice(0, MAX_CLIENT_SUGGESTIONS);
}

export async function findSourceDocumentByClient(
  clientName: string,
  documentType: 'invoice' | 'estimate' | null,
  selector: 'last' | 'latest' | 'recent' | null
): Promise<SourceDocumentData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, email, phone, address')
    .eq('user_id', user.id)
    .ilike('name', `%${clientName}%`)
    .limit(1);

  if (!clients?.length) return null;

  const client = clients[0];

  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('client_id', client.id);

  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  query = query.order('created_at', { ascending: false }).limit(1);

  const { data: docs, error } = await query;

  if (error || !docs?.length) return null;

  const doc = docs[0];

  return {
    id: doc.id,
    type: doc.document_type,
    number: doc.document_number,
    total: doc.total,
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email || '',
    items: (doc.line_items || []).map(
      (item: { id?: string; description: string; quantity?: number; rate?: number; total: number }, index: number) => ({
        id: item.id || `item-${index}`,
        description: item.description,
        quantity: item.quantity || 1,
        rate: item.rate || item.total,
        total: item.total,
      })
    ),
    createdAt: doc.created_at,
  };
}

async function generateDocumentNumber(userId: string, type: 'invoice' | 'estimate'): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === 'invoice' ? 'INV' : 'EST';
  const pattern = `${prefix}-${year}-%`;

  const { data: existingDocs } = await supabase
    .from('documents')
    .select('document_number')
    .eq('user_id', userId)
    .like('document_number', pattern)
    .order('document_number', { ascending: false })
    .limit(10);

  let nextNumber = 1;
  if (existingDocs?.length) {
    for (const doc of existingDocs) {
      const match = doc.document_number?.match(new RegExp(`${prefix}-${year}-(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= nextNumber) nextNumber = num + 1;
      }
    }
  }

  return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function executeTransform(config: TransformConfig): Promise<TransformResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const sourceDoc = await findSourceDocumentByClient(
      config.sourceDocumentId,
      config.sourceDocumentType,
      null
    );

    if (!sourceDoc) return { success: false, error: 'Source document not found' };

    const targetType = config.conversion.targetType;
    if (sourceDoc.type === targetType) {
      return { success: false, error: 'Source document is already the target type' };
    }

    const { data: job, error: jobError } = await supabase
      .from('transform_jobs')
      .insert({
        user_id: user.id,
        source_document_id: config.sourceDocumentId,
        source_document_type: config.sourceDocumentType,
        source_total: sourceDoc.total,
        source_client_id: sourceDoc.clientId,
        config: { conversion: { enabled: true, targetType } },
        status: 'processing',
      })
      .select()
      .single();

    if (jobError || !job) return { success: false, error: 'Failed to create transform job' };

    const docNumber = await generateDocumentNumber(user.id, targetType);

    const { data: newDoc, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        client_id: sourceDoc.clientId,
        document_type: targetType,
        document_number: docNumber,
        title: `${targetType === 'invoice' ? 'Invoice' : 'Estimate'} - Converted`,
        line_items: sourceDoc.items,
        subtotal: sourceDoc.total,
        tax_rate: 0,
        tax_amount: 0,
        total: sourceDoc.total,
        status: 'draft',
        transform_job_id: job.id,
      })
      .select()
      .single();

    if (docError || !newDoc) {
      await supabase.from('transform_jobs').update({ status: 'cancelled' }).eq('id', job.id);
      return { success: false, error: 'Failed to create converted document' };
    }

    await supabase
      .from('transform_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.id);

    return {
      success: true,
      job: { id: job.id },
      generatedDocument: { id: newDoc.id },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transform failed',
    };
  }
}
