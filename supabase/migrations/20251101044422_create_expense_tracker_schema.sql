/*
  # Expense Tracker Database Schema

  1. New Tables
    - `categories`: Stores built-in and custom expense/income categories
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `type` (text: 'expense' or 'income')
      - `icon` (text)
      - `is_custom` (boolean, default false)
      - `color` (text)
      - `created_at` (timestamp)
    
    - `transactions`: Stores all income and expense transactions
      - `id` (uuid, primary key)
      - `type` (text: 'income' or 'expense')
      - `amount` (numeric)
      - `category_id` (uuid, foreign key)
      - `description` (text)
      - `date` (date)
      - `created_at` (timestamp)
      - `is_recurring` (boolean, default false)
      - `recurring_frequency` (text: 'daily', 'weekly', 'monthly', 'yearly' - nullable)
      - `recurring_end_date` (date - nullable)
    
    - `budgets`: Stores monthly budget limits per category
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `limit_amount` (numeric)
      - `month` (date: first day of month)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - All data is accessible since this is a single-user app (policies allow full access)
    - Policies ensure data integrity

  3. Initial Data
    - Create built-in expense categories: Food, Transportation, Entertainment, Bills, Shopping, Healthcare, Utilities, Education, Other
    - Create built-in income categories: Salary, Freelance, Investment, Bonus, Other
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  icon text NOT NULL,
  is_custom boolean DEFAULT false,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  is_recurring boolean DEFAULT false,
  recurring_frequency text CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly', NULL)),
  recurring_end_date date
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  limit_amount numeric NOT NULL CHECK (limit_amount > 0),
  month date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, month)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies (single-user app - allow all operations)
CREATE POLICY "Allow all access to categories"
  ON categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to transactions"
  ON transactions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to budgets"
  ON budgets FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);

-- Insert built-in expense categories
INSERT INTO categories (name, type, icon, is_custom, color) VALUES
  ('Food & Dining', 'expense', 'Utensils', false, '#F87171'),
  ('Transportation', 'expense', 'Car', false, '#FB923C'),
  ('Entertainment', 'expense', 'Popcorn', false, '#FBBF24'),
  ('Bills & Utilities', 'expense', 'Zap', false, '#10B981'),
  ('Shopping', 'expense', 'ShoppingBag', false, '#06B6D4'),
  ('Healthcare', 'expense', 'Heart', false, '#EC4899'),
  ('Education', 'expense', 'BookOpen', false, '#8B5CF6'),
  ('Other Expenses', 'expense', 'Package', false, '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert built-in income categories
INSERT INTO categories (name, type, icon, is_custom, color) VALUES
  ('Salary', 'income', 'Briefcase', false, '#10B981'),
  ('Freelance', 'income', 'Laptop', false, '#3B82F6'),
  ('Investment Returns', 'income', 'TrendingUp', false, '#8B5CF6'),
  ('Bonus', 'income', 'Gift', false, '#FBBF24'),
  ('Other Income', 'income', 'DollarSign', false, '#10B981')
ON CONFLICT (name) DO NOTHING;