import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Category } from '../lib/supabase';
import { getCategories, createCustomCategory } from '../lib/utils';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: (transaction: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    date: string;
    description?: string;
    isRecurring?: boolean;
    recurringFrequency?: string;
    recurringEndDate?: string;
  }) => Promise<void>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSubmit }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Tag');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      const defaultCategory = data.find((c) => c.type === type);
      if (defaultCategory) setCategoryId(defaultCategory.id);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const defaultCategory = categories.find((c) => c.type === newType);
    if (defaultCategory) setCategoryId(defaultCategory.id);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const newCategory = await createCustomCategory(newCategoryName, type, newCategoryIcon, newCategoryColor);
      setCategories([...categories, newCategory]);
      setCategoryId(newCategory.id);
      setNewCategoryName('');
      setShowNewCategory(false);
      setError('');
    } catch (err) {
      setError('Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || !categoryId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        categoryId,
        date,
        description: description || undefined,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        recurringEndDate: isRecurring ? recurringEndDate : undefined,
      });
      onClose();
    } catch (err) {
      setError('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            {showNewCategory && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  placeholder="Color (e.g., #3B82F6)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                >
                  Create Category
                </button>
              </div>
            )}

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-slate-700">Make this recurring</span>
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Frequency</label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date (optional)</label>
                <input
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoadingCategories}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};
