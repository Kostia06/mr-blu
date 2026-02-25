import { supabase } from '@/lib/supabase/client';

interface PricingLookupResult {
  found: boolean;
  material?: string;
  historicalRatePerUnit?: number;
  suggestedPrice?: number;
  confidence?: number;
  basedOn?: string;
}

interface PricingSaveItem {
  description: string;
  material?: string;
  measurementType?: string;
  quantity: number;
  rate: number;
  total: number;
}

interface PricingEntry {
  id: string;
  material: string;
  measurement_type: string;
  rate_per_unit: number;
  base_quantity: number;
  base_rate: number;
  usage_count: number;
  last_used_at: string;
}

interface PricingUpdateData {
  rate_per_unit: number;
  base_quantity?: number;
  base_rate?: number;
}

export interface PriceSearchResult {
  id: string;
  name: string;
  unit_price: number;
  unit: string;
  category: string;
}

export async function searchPriceItems(query: string): Promise<PriceSearchResult[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: items } = await supabase
    .from('price_items')
    .select('id, name, unit_price, unit, category')
    .eq('user_id', user.id)
    .ilike('name', `%${query}%`)
    .order('times_used', { ascending: false })
    .limit(8);

  if (!items) return [];

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    unit_price: item.unit_price,
    unit: item.unit || 'unit',
    category: item.category || '',
  }));
}

export async function lookupPricing(
  material: string,
  measurementType: string,
  quantity: number
): Promise<PricingLookupResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { found: false };

  const { data: items } = await supabase
    .from('price_items')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', `%${material}%`)
    .limit(5);

  if (!items || items.length === 0) return { found: false };

  const match = items.find(
    (item) => item.unit?.toLowerCase() === measurementType.toLowerCase()
  ) || items[0];

  const timesUsed = match.times_used || 0;
  const confidence = Math.min(0.95, 0.5 + timesUsed * 0.05);

  return {
    found: true,
    material: match.name,
    historicalRatePerUnit: match.unit_price,
    suggestedPrice: match.unit_price * quantity,
    confidence,
    basedOn: `${timesUsed} previous use${timesUsed === 1 ? '' : 's'}`,
  };
}

export async function savePricing(items: PricingSaveItem[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const rows = items.map((item) => ({
    user_id: user.id,
    name: item.material || item.description,
    unit_price: item.rate,
    unit: item.measurementType || 'unit',
    category: 'other',
    times_used: 1,
    last_used_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('price_items')
    .upsert(rows, { onConflict: 'user_id,name,unit' });

  return !error;
}

export async function listPricing(): Promise<{ items: PricingEntry[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [] };

  const { data } = await supabase
    .from('price_items')
    .select('*')
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false });

  const items: PricingEntry[] = (data || []).map((row) => ({
    id: row.id,
    material: row.name,
    measurement_type: row.unit || 'unit',
    rate_per_unit: row.unit_price,
    base_quantity: 1,
    base_rate: row.unit_price,
    usage_count: row.times_used || 0,
    last_used_at: row.last_used_at || '',
  }));

  return { items };
}

export interface AddPricingData {
  name: string;
  unit: string;
  unitPrice: number;
}

export async function addPricing(data: AddPricingData): Promise<PricingEntry | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from('price_items')
    .upsert({
      user_id: user.id,
      name: data.name,
      unit: data.unit,
      unit_price: data.unitPrice,
      category: 'other',
      times_used: 0,
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name,unit' })
    .select('*')
    .single();

  if (error || !row) return null;

  return {
    id: row.id,
    material: row.name,
    measurement_type: row.unit || 'unit',
    rate_per_unit: row.unit_price,
    base_quantity: 1,
    base_rate: row.unit_price,
    usage_count: row.times_used || 0,
    last_used_at: row.last_used_at || '',
  };
}

export async function deletePricing(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('price_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function updatePricing(
  id: string,
  data: PricingUpdateData
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('price_items')
    .update({
      unit_price: data.rate_per_unit,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
