import type { Client } from './client';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: LineItem[];
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface InvoiceInsert {
  client_id: string;
  number?: string;
  status?: Invoice['status'];
  items: Omit<LineItem, 'id'>[];
  subtotal: number;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total: number;
  notes?: string | null;
  due_date?: string | null;
}

export interface InvoiceUpdate extends Partial<InvoiceInsert> {
  id: string;
}
