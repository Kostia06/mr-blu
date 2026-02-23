import { z } from 'zod';

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
});

export const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Client required'),
  items: z.array(lineItemSchema).min(1, 'At least one item required'),
  notes: z.string().optional(),
  due_date: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
