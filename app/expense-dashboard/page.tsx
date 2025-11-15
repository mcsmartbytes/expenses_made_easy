'use client';
import Navigation from '@/components/Navigation';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

interface ExpenseSummary {
  totalThisMonth: number;
  totalLastMonth: number;
  businessExpenses: number;
  personalExpenses: number;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  vendor: string | null;
  is_business: boolean;
  category: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

export default function ExpenseDashboard() {
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalThisMonth: 0,
    totalLastMonth: 0,
    businessExpenses: 0,
    personalExpenses: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: thisMonth } = await supabase
        .from('expenses')
        .select('amount, is_business')
        .eq('user_id', user.id)
        .gte('date', firstDayThisMonth.toISOString().split('T')[0]);

      const { data: lastMonth } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', firstDayLastMonth.toISOString().split('T')[0])
        .lte('date', lastDayLastMonth.toISOString().split('T')[0]);

      const { data: recent } = await supabase
        .from('expenses')
        .select('id, amount, description, date, vendor, is_business, categories(name, icon, color)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      const totalThisMonth = thisMonth?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalLastMonth = lastMonth?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const businessExpenses = thisMonth?.filter(e => e.is_business).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const personalExpenses = thisMonth?.filter(e => !e.is_business).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setSummary({
        totalThisMonth,
        totalLastMonth,
        businessExpenses,
        personalExpenses,
      });

      const formattedExpenses = recent?.map((exp: any) => ({
        ...exp,
        category: exp.categories || null
      })) || [];

      setRecentExpenses(formattedExpenses as Expense[]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
      loadDashboard();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const percentChange = summary.totalLastMonth > 0
    ? ((summary.totalThisMonth - summary.totalLastMonth) / summary.totalLastMonth) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex gap-3">
              <Link href="/expenses/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                + Add Expense
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${summary.totalThisMonth.toFixed(2)}</p>
            {percentChange !== 0 && (
              <p className={`text-sm mt-2 ${percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}% from last month
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Last Month</h3>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${summary.totalLastMonth.toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Business</h3>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">${summary.businessExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Personal</h3>
              <span className="text-2xl">🏠</span>
            </div>
            <p className="text-3xl font-bold text-gray-600">${summary.personalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <Link href="/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-gray-200">
            {recentExpenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No expenses yet</p>
                <Link href="/expenses/new" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                  Add Your First Expense
                </Link>
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {expense.category && <span className="text-2xl">{expense.category.icon}</span>}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          {expense.is_business && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Business</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                          {expense.vendor && <span>• {expense.vendor}</span>}
                          {expense.category && <span>• {expense.category.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                      <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-700 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
