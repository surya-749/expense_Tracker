import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Category, Budget } from '../lib/supabase';
import { getBudgets, setBudget, deleteBudget, getCategorySpending } from '../lib/utils';
import * as Icons from 'lucide-react';

interface BudgetManagerProps {
  categories: Category[];
  selectedMonth: string;
  onClose: () => void;
}

interface BudgetWithSpending extends Budget {
  spent: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ categories, selectedMonth, onClose }) => {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const data = await getBudgets(selectedMonth);
      const budgetsWithSpending = await Promise.all(
        data.map(async (budget) => {
          const spent = await getCategorySpending(budget.category_id, selectedMonth);
          const category = categories.find((c) => c.id === budget.category_id);
          return {
            ...budget,
            spent: Number(spent),
            categoryName: category?.name || 'Unknown',
            categoryColor: category?.color || '#6B7280',
            categoryIcon: category?.icon || 'Package',
          };
        })
      );
      setBudgets(budgetsWithSpending);
    } catch (err) {
      setError('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const usedCategoryIds = budgets.map((b) => b.category_id);
  const availableCategories = expenseCategories.filter((c) => !usedCategoryIds.includes(c.id));

  const handleAddBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      await setBudget(newBudgetCategory, parseFloat(newBudgetAmount), selectedMonth);
      setNewBudgetCategory('');
      setNewBudgetAmount('');
      await loadBudgets();
    } catch (err) {
      setError('Failed to add budget');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    setDeletingIds(new Set([...deletingIds, id]));
    try {
      await deleteBudget(id);
      await loadBudgets();
    } catch (err) {
      setError('Failed to delete budget');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className: string }>;
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Budget Manager</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isAdding ? (
            <div className="bg-slate-50 rounded-lg p-4 border-2 border-blue-200 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={newBudgetCategory}
                    onChange={(e) => setNewBudgetCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Budget Limit</label>
                  <input
                    type="number"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddBudget}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Add Budget
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewBudgetCategory('');
                    setNewBudgetAmount('');
                  }}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              disabled={availableCategories.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Add New Budget
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          <div>
            <h3 className="font-bold text-slate-900 mb-4">Current Budgets</h3>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No budgets set for this month</p>
            ) : (
              <div className="space-y-3">
                {budgets.map((budget) => {
                  const percentage = (budget.spent / budget.limit_amount) * 100;
                  const isOverBudget = percentage > 100;
                  const isWarning = percentage >= 80;

                  return (
                    <div
                      key={budget.id}
                      className={`p-4 rounded-lg border-2 ${
                        isOverBudget
                          ? 'bg-red-50 border-red-300'
                          : isWarning
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: budget.categoryColor }}
                          >
                            {getIcon(budget.categoryIcon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900">{budget.categoryName}</p>
                            <p className={`text-sm ${isOverBudget ? 'text-red-700' : 'text-slate-600'}`}>
                              ₹{budget.spent.toFixed(2)} of ₹{budget.limit_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          disabled={deletingIds.has(budget.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-full bg-slate-300 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isOverBudget
                              ? 'bg-red-500'
                              : isWarning
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        ></div>
                      </div>

                      <p className={`text-xs mt-2 font-medium ${
                        isOverBudget
                          ? 'text-red-700'
                          : isWarning
                            ? 'text-amber-700'
                            : 'text-slate-600'
                      }`}>
                        {percentage.toFixed(0)}% of budget
                        {isOverBudget && ` (Over by ₹${(budget.spent - budget.limit_amount).toFixed(2)})`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
