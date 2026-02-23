import { supabase } from '@/lib/supabase/client';

interface ItemSuggestion {
  description: string;
  rate: number;
  count: number;
  unit: string;
}

function cleanUnit(unit: string | undefined | null): string {
  if (!unit || typeof unit !== 'string') return 'unit';
  const trimmed = unit.trim();
  if (/^\d+$/.test(trimmed)) return 'unit';
  if (trimmed.includes('@') || trimmed.includes('$') || trimmed.includes('null')) {
    const cleanWord = trimmed.replace(/[\d@$,.\s]+/g, ' ').trim().split(/\s+/)[0];
    if (cleanWord && cleanWord !== 'null' && cleanWord.length > 0 && cleanWord.length <= 15) {
      return cleanWord;
    }
    return 'unit';
  }
  if (trimmed.length > 0 && trimmed.length <= 15 && /^[a-zA-Z]+$/.test(trimmed)) {
    return trimmed;
  }
  return 'unit';
}

export async function fetchItemSuggestions(): Promise<ItemSuggestion[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const [{ data: invoices }, { data: priceItems }] = await Promise.all([
    supabase
      .from('documents')
      .select('line_items')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('price_items')
      .select('name, unit_price, unit, times_used')
      .eq('user_id', user.id)
      .order('times_used', { ascending: false })
      .limit(20),
  ]);

  const itemMap = new Map<string, ItemSuggestion>();

  for (const invoice of invoices || []) {
    const items = (invoice.line_items as Array<{ description: string; rate: number; unit?: string }>) || [];
    for (const item of items) {
      if (!item.description) continue;
      const key = item.description.toLowerCase().trim();
      const existing = itemMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        itemMap.set(key, {
          description: item.description,
          rate: item.rate || 0,
          unit: cleanUnit(item.unit),
          count: 1,
        });
      }
    }
  }

  for (const item of priceItems || []) {
    if (!item.name) continue;
    const key = (item.name as string).toLowerCase().trim();
    const existing = itemMap.get(key);
    if (existing) {
      existing.count += (item.times_used as number) || 1;
    } else {
      itemMap.set(key, {
        description: item.name as string,
        rate: (item.unit_price as number) || 0,
        unit: cleanUnit(item.unit as string),
        count: (item.times_used as number) || 1,
      });
    }
  }

  return Array.from(itemMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export async function trackItems(
  items: Array<{ description: string; quantity?: number; unit?: string; rate?: number }>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || items.length === 0) return;

  for (const item of items) {
    if (!item.description) continue;

    const name = item.description.trim();
    const { data: existing } = await supabase
      .from('price_items')
      .select('id, times_used')
      .eq('user_id', user.id)
      .eq('name', name)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('price_items')
        .update({
          times_used: (existing.times_used || 0) + 1,
          unit_price: item.rate ?? undefined,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('price_items')
        .insert({
          user_id: user.id,
          name,
          unit_price: item.rate || 0,
          unit: cleanUnit(item.unit),
          times_used: 1,
          last_used_at: new Date().toISOString(),
        });
    }
  }
}
