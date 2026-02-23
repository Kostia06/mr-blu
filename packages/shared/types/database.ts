export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          number: string;
          status: string;
          items: Json;
          subtotal: number;
          tax_rate: number | null;
          tax_amount: number | null;
          total: number;
          notes: string | null;
          due_date: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          number?: string;
          status?: string;
          items: Json;
          subtotal: number;
          tax_rate?: number | null;
          tax_amount?: number | null;
          total: number;
          notes?: string | null;
          due_date?: string | null;
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      clients: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      price_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          price: number;
          unit: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: number;
          description?: string | null;
          unit?: string | null;
          category?: string | null;
        };
        Update: Partial<Database['public']['Tables']['price_items']['Insert']>;
      };
    };
  };
}
