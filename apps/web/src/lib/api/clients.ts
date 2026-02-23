import { supabase } from '@/lib/supabase/client';
import { calculateSimilarity } from '@/lib/utils/phonetic';

interface ClientUpdates {
  email?: string;
  phone?: string;
  name?: string;
  notes?: string;
}

interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface ClientDocument {
  id: string;
  document_type: string;
  document_number: string;
  total: number;
  status: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  similarity?: number;
}

interface LookupResult {
  client: Client | null;
  confidence: number;
  needsConfirmation: boolean;
}

interface SuggestResult {
  suggestions: Array<Client & { similarity: number }>;
  exactMatch: (Client & { similarity: number }) | null;
  searchedFor: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function listClients(): Promise<{ items: Client[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [] };

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, address, notes')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to list clients:', error);
    return { items: [] };
  }

  return { items: data ?? [] };
}

export async function deleteClient(clientId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete client:', error);
    return false;
  }

  return true;
}

export async function updateClient(
  clientId: string,
  updates: ClientUpdates
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (error) {
    console.error('Failed to update client:', error);
    return false;
  }

  return true;
}

export async function lookupClient(name: string): Promise<LookupResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { client: null, confidence: 0, needsConfirmation: false };
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, address, notes')
    .eq('user_id', user.id);

  if (error || !clients?.length) {
    return { client: null, confidence: 0, needsConfirmation: false };
  }

  let bestMatch: Client | null = null;
  let bestScore = 0;

  for (const client of clients) {
    const score = calculateSimilarity(name, client.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = client;
    }
  }

  if (bestScore < 0.5 || !bestMatch) {
    return { client: null, confidence: 0, needsConfirmation: false };
  }

  return {
    client: bestMatch,
    confidence: bestScore,
    needsConfirmation: bestScore < 0.8,
  };
}

export async function suggestClients(
  name: string,
  limit = 5
): Promise<SuggestResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { suggestions: [], exactMatch: null, searchedFor: name };
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, address, notes')
    .eq('user_id', user.id);

  if (error || !clients?.length) {
    return { suggestions: [], exactMatch: null, searchedFor: name };
  }

  const normalizedName = normalizeText(name);

  const scored = clients
    .map((client) => ({
      ...client,
      similarity: calculateSimilarity(normalizedName, normalizeText(client.name)),
    }))
    .filter((client) => client.similarity >= 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  const exactMatch = scored.find((c) => c.similarity >= 0.9) ?? null;

  return {
    suggestions: scored,
    exactMatch,
    searchedFor: name,
  };
}

export async function createClient(
  input: CreateClientInput
): Promise<Client | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .select('id, name, email, phone, address, notes')
    .single();

  if (error) {
    console.error('Failed to create client:', error);
    return null;
  }

  return data;
}

export async function fetchClientDocuments(
  clientId: string
): Promise<ClientDocument[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('id, document_type, document_number, total, status, created_at')
    .eq('client_id', clientId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch client documents:', error);
    return [];
  }

  return data ?? [];
}
