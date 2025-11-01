import { supabase, Transaction, Budget, Category } from './supabase';

export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('type');
  if (error) throw error;
  return data as Category[];
};

export const createCustomCategory = async (name: string, type: 'income' | 'expense', icon: string, color: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, type, icon, is_custom: true, color }])
    .select()
    .single();
  if (error) throw error;
  return data as Category;
};

export const getTransactions = async (startDate?: string, endDate?: string) => {
  let query = supabase
    .from('transactions')
    .select('*, categories(*)')
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const addTransaction = async (
  type: 'income' | 'expense',
  amount: number,
  categoryId: string,
  date: string,
  description?: string,
  isRecurring?: boolean,
  recurringFrequency?: string,
  recurringEndDate?: string
) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        type,
        amount,
        category_id: categoryId,
        date,
        description: description || null,
        is_recurring: isRecurring || false,
        recurring_frequency: recurringFrequency || null,
        recurring_end_date: recurringEndDate || null,
      },
    ])
    .select('*, categories(*)')
    .single();
  if (error) throw error;
  return data;
};

export const updateTransaction = async (
  id: string,
  updates: Partial<{
    type: 'income' | 'expense';
    amount: number;
    category_id: string;
    date: string;
    description: string;
    is_recurring: boolean;
    recurring_frequency: string;
    recurring_end_date: string;
  }>
) => {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select('*, categories(*)')
    .single();
  if (error) throw error;
  return data;
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
};

export const getBudgets = async (month: string) => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('month', month);
  if (error) throw error;
  return data;
};

export const setBudget = async (categoryId: string, limitAmount: number, month: string) => {
  const { data: existing, error: existError } = await supabase
    .from('budgets')
    .select('id')
    .eq('category_id', categoryId)
    .eq('month', month)
    .maybeSingle();

  if (existError) throw existError;

  if (existing) {
    const { data, error } = await supabase
      .from('budgets')
      .update({ limit_amount: limitAmount, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  } else {
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ category_id: categoryId, limit_amount: limitAmount, month }])
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  }
};

export const deleteBudget = async (id: string) => {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
};

export const getMonthlySpending = async (month: string, type: 'income' | 'expense') => {
  const startDate = month;
  const endDate = new Date(new Date(month).setMonth(new Date(month).getMonth() + 1));
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('type', type)
    .gte('date', startDate)
    .lt('date', endDateStr);

  if (error) throw error;
  return data;
};

export const getCategorySpending = async (categoryId: string, month: string) => {
  const startDate = month;
  const endDate = new Date(new Date(month).setMonth(new Date(month).getMonth() + 1));
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lt('date', endDateStr);

  if (error) throw error;
  return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
};
