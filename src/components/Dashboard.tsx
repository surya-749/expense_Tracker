import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { getMonthlySpending, getCategorySpending, getBudgets } from '../lib/utils';
import { Category, TransactionWithCategory } from '../lib/supabase';
import * as Icons from 'lucide-react';

interface DashboardProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  selectedMonth: string;
  timeView: 'day' | 'week' | 'month';
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  selectedMonth,
  timeView,
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [budgetAlerts, setBudgetAlerts] = useState<
    Array<{ categoryName: string; spent: number; limit: number; percentage: number }>
  >([]);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expenses: 0,
    net: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [transactions, selectedMonth, timeView]);

  const calculateStats = async () => {
    let filtered = transactions;

    if (timeView === 'day') {
      filtered = transactions.filter((t) => t.date === selectedMonth);
    } else if (timeView === 'week') {
      const date = new Date(selectedMonth);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      filtered = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= startOfWeek && tDate <= endOfWeek;
      });
    } else {
      const [year, month] = selectedMonth.split('-');
      filtered = transactions.filter(
        (t) => t.date.startsWith(`${year}-${month}`)
      );
    }

    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    setMonthlyStats({
      income,
      expenses,
      net: income - expenses,
    });

    if (timeView === 'month') {
      await checkBudgetAlerts();
    }
  };

  const checkBudgetAlerts = async () => {
    try {
      const budgets = await getBudgets(selectedMonth);
      const alerts = [];

      for (const budget of budgets) {
        const spent = await getCategorySpending(budget.category_id, selectedMonth);
        const percentage = (spent / budget.limit_amount) * 100;

        if (percentage >= 80) {
          const categoryName = categories.find((c) => c.id === budget.category_id)?.name || 'Unknown';
          alerts.push({
            categoryName,
            spent: Number(spent),
            limit: budget.limit_amount,
            percentage,
          });
        }
      }

      setBudgetAlerts(alerts);
    } catch (err) {
      console.error('Failed to check budget alerts:', err);
    }
  };

  const getExpensesByCategory = () => {
    let filtered = transactions;

    if (timeView === 'day') {
      filtered = transactions.filter((t) => t.date === selectedMonth && t.type === 'expense');
    } else if (timeView === 'week') {
      const date = new Date(selectedMonth);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      filtered = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= startOfWeek && tDate <= endOfWeek && t.type === 'expense';
      });
    } else {
      const [year, month] = selectedMonth.split('-');
      filtered = transactions.filter(
        (t) => t.date.startsWith(`${year}-${month}`) && t.type === 'expense'
      );
    }

    const grouped = filtered.reduce(
      (acc, trans) => {
        const categoryName = trans.categories?.name || 'Other';
        if (!acc[categoryName]) {
          acc[categoryName] = {
            amount: 0,
            color: trans.categories?.color || '#6B7280',
            icon: trans.categories?.icon || 'Package',
          };
        }
        acc[categoryName].amount += Number(trans.amount);
        return acc;
      },
      {} as Record<string, { amount: number; color: string; icon: string }>
    );

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      ...data,
    }));
  };

  const expenses = getExpensesByCategory();
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className: string }>;
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">Income</p>
          </div>
          <p className="text-3xl font-bold text-green-900 flex items-baseline gap-2">
            <span className="text-xl">₹</span>
            <span>{monthlyStats.income.toFixed(2)}</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-700">Expenses</p>
          </div>
          <p className="text-3xl font-bold text-red-900 flex items-baseline gap-2">
            <span className="text-xl">₹</span>
            <span>{monthlyStats.expenses.toFixed(2)}</span>
          </p>
        </div>

        <div
          className={`bg-gradient-to-br rounded-lg p-6 border ${
            monthlyStats.net >= 0
              ? 'from-blue-50 to-blue-100 border-blue-200'
              : 'from-orange-50 to-orange-100 border-orange-200'
          }`}
        >
          <p className={`text-sm font-medium mb-2 ${monthlyStats.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            Net
          </p>
          <p className={`text-3xl font-bold flex items-baseline gap-2 ${monthlyStats.net >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            <span className="text-xl">₹</span>
            <span>{monthlyStats.net.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900 mb-2">Budget Alerts</h3>
              <div className="space-y-2">
                {budgetAlerts.map((alert, i) => (
                  <p key={i} className="text-sm text-amber-800">
                    <span className="font-medium">{alert.categoryName}</span>: ₹{alert.spent.toFixed(2)} of ₹
                    {alert.limit.toFixed(2)} ({alert.percentage.toFixed(0)}%)
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {chartType === 'pie' ? (
              <PieChart className="w-5 h-5 text-blue-600" />
            ) : (
              <BarChart3 className="w-5 h-5 text-blue-600" />
            )}
            <h3 className="font-bold text-slate-900">Expense Breakdown</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('pie')}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                chartType === 'pie'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                chartType === 'bar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Bar
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No expenses for this period</p>
        ) : chartType === 'pie' ? (
          <div className="space-y-4">
            {expenses.map((expense) => {
              const percentage = ((expense.amount / totalExpense) * 100).toFixed(1);
              return (
                <div key={expense.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: expense.color }}
                      ></div>
                      <span className="text-sm font-medium text-slate-700">{expense.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">₹{expense.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: expense.color,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{percentage}%</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {expenses
              .sort((a, b) => b.amount - a.amount)
              .map((expense) => {
                const maxAmount = Math.max(...expenses.map((e) => e.amount));
                const percentage = (expense.amount / maxAmount) * 100;
                return (
                  <div key={expense.name} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium text-slate-700 truncate flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: expense.color }}
                      ></div>
                      {expense.name}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-slate-200 rounded-full h-6">
                        <div
                          className="h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: expense.color,
                          }}
                        >
                          {percentage > 15 && (
                            <span className="text-xs font-bold text-white">₹{expense.amount.toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm font-semibold text-slate-900">
                      ₹{expense.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
