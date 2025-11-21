'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  vendor: string | null;
  is_business: boolean;
  payment_method?: string;
  notes?: string;
  category: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'business' | 'personal'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, description, date, vendor, is_business, payment_method, notes, categories(name, icon, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data?.map((exp: any) => ({
        ...exp,
        category: exp.categories || null
      })) || [];

      setExpenses(formattedExpenses as Expense[]);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      loadExpenses();
    }
  }

  // Filter expenses based on type and date range
  function getFilteredExpenses() {
    let filtered = expenses;

    // Filter by type
    if (filterType === 'business') {
      filtered = filtered.filter(e => e.is_business);
    } else if (filterType === 'personal') {
      filtered = filtered.filter(e => !e.is_business);
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(e => new Date(e.date) >= startOfMonth);
    } else if (dateRange === 'quarter') {
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      filtered = filtered.filter(e => new Date(e.date) >= startOfQuarter);
    } else if (dateRange === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(e => new Date(e.date) >= startOfYear);
    }

    return filtered;
  }

  // Export to CSV
  function exportToCSV() {
    const filteredExpenses = getFilteredExpenses();
    if (filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Vendor', 'Type', 'Payment Method', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(expense => [
      expense.date,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.category?.name || '',
      expense.vendor || '',
      expense.is_business ? 'Business' : 'Personal',
      expense.payment_method || '',
      expense.amount.toFixed(2),
      expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredExpenses = getFilteredExpenses();
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const businessTotal = filteredExpenses.filter(e => e.is_business).reduce((sum, e) => sum + e.amount, 0);
  const personalTotal = filteredExpenses.filter(e => !e.is_business).reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <Link href="/expenses/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                + Add Expense
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters and Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="business">Business Only</option>
                  <option value="personal">Personal Only</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Business</p>
                <p className="text-xl font-bold text-blue-600">${businessTotal.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Personal</p>
                <p className="text-xl font-bold text-gray-600">${personalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No expenses yet</p>
              <Link href="/expenses/new" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                Add Your First Expense
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {expense.category && (
                          <span className="inline-flex items-center gap-1">
                            <span>{expense.category.icon}</span>
                            <span>{expense.category.name}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{expense.vendor || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expense.is_business ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {expense.is_business ? 'Business' : 'Personal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredExpenses.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            {filterType !== 'all' || dateRange !== 'all' ? ' (filtered)' : ''}
          </p>
          <Link href="/expense-dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
