import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
