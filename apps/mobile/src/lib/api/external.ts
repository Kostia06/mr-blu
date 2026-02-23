import { supabase } from '@/lib/supabase/client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error?: string }).error || 'Request failed');
  }

  return response.json() as Promise<T>;
}

async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${API_URL}${path}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((error as { error?: string }).error || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function parseWithAI(transcription: string): Promise<any> {
  return apiPost('/api/ai/parse', { transcription });
}

export async function getDeepgramToken(): Promise<string> {
  const result = await apiGet<{ apiKey: string }>('/api/voice/token');
  if (!result.apiKey) {
    throw new Error('Deepgram API key not configured');
  }
  return result.apiKey;
}

export async function sendDocumentEmail(params: {
  documentId: string;
  documentType: string;
  method: string;
  recipient: { email: string; name?: string };
  customMessage?: string;
}): Promise<{ success: boolean; emailId?: string }> {
  return apiPost('/api/documents/send', params);
}

export async function submitFeedback(params: {
  comment: string;
  category: string;
  pageContext?: string;
}): Promise<void> {
  await apiPost('/api/feedback/submit', params);
}

export async function fetchSharedDocument(params: {
  type: string;
  id: string;
  token: string;
}): Promise<any> {
  const query = new URLSearchParams({
    type: params.type,
    id: params.id,
    token: params.token,
  });

  const url = `${API_URL}/api/documents/share?${query}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Document not found' }));
    throw new Error((error as { error?: string }).error || 'Document not found');
  }
  return response.json();
}

export async function respondToFeedback(id: string, response: string): Promise<void> {
  await apiPost('/api/feedback/respond', { id, response });
}
