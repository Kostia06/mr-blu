import { supabase } from '@/lib/supabase/client';
import { isNative } from '@/lib/native';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const API_BASE = isNative ? 'https://mrblu.com' : '';

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

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Request failed');
      if (lastError.name === 'AbortError') {
        lastError = new Error('Request timed out');
      }
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error('Request failed');
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetchWithRetry(`${API_BASE}${path}`, {
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
  const response = await fetchWithRetry(`${API_BASE}${path}`, { headers });

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
  pdfBase64?: string;
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

  const response = await fetch(`${API_BASE}/api/documents/share?${query}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Document not found' }));
    throw new Error((error as { error?: string }).error || 'Document not found');
  }
  return response.json();
}

export async function respondToFeedback(id: string, response: string): Promise<void> {
  await apiPost('/api/feedback/respond', { id, response });
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const headers = await getAuthHeaders();
  // Use the blob's actual MIME type
  headers['Content-Type'] = audioBlob.type || 'audio/webm';

  const response = await fetchWithRetry(`${API_BASE}/api/voice/transcribe`, {
    method: 'POST',
    headers,
    body: audioBlob,
  });

  if (!response.ok) {
    throw new Error('Transcription failed');
  }

  const result = (await response.json()) as { transcript: string };
  return result.transcript || '';
}
