import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Settings } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { BudgetManager } from './components/BudgetManager';
import { getCategories, getTransactions, addTransaction, deleteTransaction } from './lib/utils';
import { Category, TransactionWithCategory } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [timeView, setTimeView] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const auth = localStorage.getItem('expenseTrackerAuth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
      initializeApp();
    }
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      await loadTransactions();
    } catch (err) {
      console.error('Failed to initialize:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleAddTransaction = async (transaction: {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    date: string;
    description?: string;
    isRecurring?: boolean;
    recurringFrequency?: string;
    recurringEndDate?: string;
  }) => {
    try {
      await addTransaction(
        transaction.type,
        transaction.amount,
        transaction.categoryId,
        transaction.date,
        transaction.description,
        transaction.isRecurring,
        transaction.recurringFrequency,
        transaction.recurringEndDate
      );
      await loadTransactions();
    } catch (err) {
      console.error('Failed to add transaction:', err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      await loadTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('expenseTrackerAuth');
    setIsAuthenticated(false);
    setTransactions([]);
    setCategories([]);
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const date = new Date(currentDate);
    if (timeView === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (timeView === 'week') {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    }
    const newDate = date.toISOString().split('T')[0];
    setCurrentDate(newDate);
    setSelectedMonth(newDate.slice(0, 7));
  };

  const getDateRangeDisplay = () => {
    const date = new Date(currentDate);
    if (timeView === 'day') {
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (timeView === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => { setIsAuthenticated(true); initializeApp(); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Expense Tracker</h1>
            <p className="text-slate-600 text-sm">Manage your finances effortlessly</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBudgetManager(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Budgets
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => handleDateChange('prev')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                ←
              </button>
              <div className="text-center flex-1">
                <h2 className="text-xl font-bold text-slate-900">{getDateRangeDisplay()}</h2>
              </div>
              <button
                onClick={() => handleDateChange('next')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                →
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(['day', 'week', 'month'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setTimeView(view)}
                  className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${
                    timeView === view
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTransactionForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-600">Loading your data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Transactions</h3>
                <TransactionList
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                  isLoading={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Overview</h3>
                <Dashboard
                  transactions={transactions}
                  categories={categories}
                  selectedMonth={selectedMonth}
                  timeView={timeView}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
          onSubmit={handleAddTransaction}
        />
      )}

      {showBudgetManager && (
        <BudgetManager
          categories={categories}
          selectedMonth={selectedMonth}
          onClose={() => setShowBudgetManager(false)}
        />
      )}
    </div>
  );
}

export default App;
