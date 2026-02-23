import { supabase } from '@/lib/supabase/client';

export interface ReviewSession {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  intent_type: 'document_action' | 'information_query';
  original_transcript: string | null;
  parsed_data: Record<string, unknown>;
  actions: Array<{ type: string; status: string }>;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
  created_document_id: string | null;
  created_document_type: string | null;
}

export async function fetchReviewSessions(
  userId: string
): Promise<ReviewSession[]> {
  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as ReviewSession[];
}

interface ReviewSessionInput {
  originalTranscript?: string;
  audioUrl?: string;
  intentType?: string;
  parsedData?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  queryData?: Record<string, unknown>;
  queryResult?: Record<string, unknown>;
  sourceDocumentId?: string;
  sourceDocumentType?: string;
  confidence?: Record<string, number>;
  summary?: string;
  status?: string;
}

interface ReviewSessionUpdates {
  parsedData?: Record<string, unknown>;
  queryData?: Record<string, unknown>;
  queryResult?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
  summary?: string;
  status?: string;
  intentType?: string;
  sourceDocumentId?: string;
  sourceDocumentType?: string;
  confidence?: Record<string, number>;
  originalTranscript?: string;
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  originalTranscript: 'original_transcript',
  audioUrl: 'audio_url',
  intentType: 'intent_type',
  parsedData: 'parsed_data',
  queryData: 'query_data',
  queryResult: 'query_result',
  sourceDocumentId: 'source_document_id',
  sourceDocumentType: 'source_document_type',
};

function mapToSnakeCase(
  input: Record<string, unknown>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const snakeKey = CAMEL_TO_SNAKE[key] ?? key;
    mapped[snakeKey] = value;
  }

  return mapped;
}

export async function createReviewSession(
  data: ReviewSessionInput
): Promise<{ success: boolean; review?: { id: string }; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const row = {
    user_id: user.id,
    status: data.status || 'in_progress',
    ...mapToSnakeCase(data as unknown as Record<string, unknown>),
  };

  const { data: created, error } = await supabase
    .from('review_sessions')
    .insert(row)
    .select('id')
    .single();

  if (error) {
    console.error('Create review session error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, review: { id: created.id } };
}

export async function updateReviewSession(
  id: string,
  updates: ReviewSessionUpdates
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const row: Record<string, unknown> = {
    ...mapToSnakeCase(updates as unknown as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'completed') {
    row.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('review_sessions')
    .update(row)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Update review session error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteReviewSession(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('review_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete review session error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
