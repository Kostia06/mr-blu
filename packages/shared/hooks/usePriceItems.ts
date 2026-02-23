import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PriceItem, PriceItemInsert } from '../types';

let supabase: any;

export function initSupabase(client: any) {
  supabase = client;
}

export function usePriceItems() {
  return useQuery({
    queryKey: ['price-items'],
    queryFn: async (): Promise<PriceItem[]> => {
      const { data, error } = await supabase
        .from('price_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePriceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PriceItemInsert) => {
      const { data, error } = await supabase
        .from('price_items')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-items'] });
    },
  });
}
