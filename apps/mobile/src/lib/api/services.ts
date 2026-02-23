import { supabase } from '@/lib/supabase/client';

interface MaterialOption {
  name: string;
  rate: number;
}

interface ServiceItem {
  id: string;
  description: string;
  unit: string;
  defaultRate: number;
  materialOptions: MaterialOption[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  items: ServiceItem[];
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateServiceInput {
  name: string;
  description?: string;
  items?: ServiceItem[];
}

interface UpdateServiceInput {
  name?: string;
  description?: string;
  items?: ServiceItem[];
}

export type { Service, ServiceItem, MaterialOption };

export async function listServices(): Promise<{ items: Service[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [] };

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, items, times_used, last_used_at, created_at, updated_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to list services:', error);
    return { items: [] };
  }

  return { items: data ?? [] };
}

export async function getService(id: string): Promise<Service | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, items, times_used, last_used_at, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Failed to get service:', error);
    return null;
  }

  return data;
}

export async function createService(input: CreateServiceInput): Promise<Service | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('services')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description || null,
      items: input.items || [],
    })
    .select('id, name, description, items, times_used, last_used_at, created_at, updated_at')
    .single();

  if (error) {
    console.error('Failed to create service:', error);
    return null;
  }

  return data;
}

export async function updateService(
  id: string,
  updates: UpdateServiceInput
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('services')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to update service:', error);
    return false;
  }

  return true;
}

interface DocumentLineItem {
  description: string;
  rate: number;
  unit: string;
  material?: string | null;
  measurementType?: string | null;
}

function buildServiceItems(lineItems: DocumentLineItem[]): ServiceItem[] {
  return lineItems.map((item) => ({
    id: Math.random().toString(36).substring(2, 11),
    description: item.description,
    unit: item.measurementType || item.unit || 'service',
    defaultRate: item.rate,
    materialOptions: item.material
      ? [{ name: item.material, rate: item.rate }]
      : [],
  }));
}

function mergeItems(
  existingItems: ServiceItem[],
  newItems: ServiceItem[]
): ServiceItem[] {
  const merged = existingItems.map((item) => ({ ...item, materialOptions: [...item.materialOptions] }));

  for (const incoming of newItems) {
    const match = merged.find(
      (m) => m.description.toLowerCase() === incoming.description.toLowerCase()
    );

    if (!match) {
      merged.push(incoming);
      continue;
    }

    match.defaultRate = incoming.defaultRate;
    match.unit = incoming.unit;

    for (const opt of incoming.materialOptions) {
      const existingOpt = match.materialOptions.find(
        (o) => o.name.toLowerCase() === opt.name.toLowerCase()
      );
      if (existingOpt) {
        existingOpt.rate = opt.rate;
      } else {
        match.materialOptions.push({ ...opt });
      }
    }
  }

  return merged;
}

export async function saveServiceFromDocument(
  name: string,
  lineItems: DocumentLineItem[]
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const newItems = buildServiceItems(lineItems);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('services')
    .select('id, name, items, times_used')
    .eq('user_id', user.id)
    .ilike('name', name)
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from('services')
      .insert({ user_id: user.id, name, items: newItems, times_used: 1, last_used_at: now });
    return !error;
  }

  const existingItems = (existing.items ?? []) as ServiceItem[];
  const mergedItems = mergeItems(existingItems, newItems);

  const { error } = await supabase
    .from('services')
    .update({
      items: mergedItems,
      times_used: (existing.times_used || 0) + 1,
      last_used_at: now,
      updated_at: now,
    })
    .eq('id', existing.id);

  return !error;
}

export async function deleteService(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete service:', error);
    return false;
  }

  return true;
}
