import React from 'react';
import { Trash2 } from 'lucide-react';
import { TransactionWithCategory } from '../lib/supabase';
import * as Icons from 'lucide-react';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, isLoading }) => {
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    setDeletingIds(new Set([...deletingIds, id]));
    try {
      await onDelete(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">No transactions yet</p>
        <p className="text-slate-400 text-sm">Add your first transaction to get started</p>
      </div>
    );
  }

  const groupedByDate = transactions.reduce(
    (acc, trans) => {
      const date = trans.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(trans);
      return acc;
    },
    {} as Record<string, TransactionWithCategory[]>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] as React.ComponentType<{ className: string }>;
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase">{formatDate(date)}</h3>
          <div className="space-y-2">
            {dayTransactions.map((trans) => (
              <div
                key={trans.id}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition border border-slate-200"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: trans.categories?.color }}
                  >
                    {getIcon(trans.categories?.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{trans.categories?.name}</p>
                    {trans.description && <p className="text-xs text-slate-500 truncate">{trans.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={`font-semibold text-lg ${
                        trans.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {trans.type === 'income' ? '+' : '-'}
                      <span className="inline-flex items-baseline gap-1">
                        <span className="text-sm">₹</span>
                        <span>{trans.amount.toFixed(2)}</span>
                      </span>
                    </p>
                    {trans.is_recurring && (
                      <p className="text-xs text-slate-500 capitalize">{trans.recurring_frequency}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(trans.id)}
                    disabled={deletingIds.has(trans.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
