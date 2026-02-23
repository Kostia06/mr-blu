export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  notes?: string | null;
}

export interface PriceItem {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceItemInsert {
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  category?: string | null;
}
