import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  is_custom: boolean;
  color: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  description: string | null;
  date: string;
  created_at: string;
  is_recurring: boolean;
  recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_end_date: string | null;
};

export type Budget = {
  id: string;
  category_id: string;
  limit_amount: number;
  month: string;
  created_at: string;
  updated_at: string;
};

export type TransactionWithCategory = Transaction & {
  categories: Category;
};
