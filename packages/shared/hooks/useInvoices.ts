import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice, InvoiceInsert } from '../types';

let supabase: any;

export function initSupabase(client: any) {
  supabase = client;
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async (): Promise<Invoice> => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, clients(*), line_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InvoiceInsert) => {
      const { data, error } = await supabase
        .from('documents')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<InvoiceInsert>) => {
      const { data, error } = await supabase
        .from('documents')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
