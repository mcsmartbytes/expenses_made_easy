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
  totalDeductible: number;
  fullyDeductible: number;
  partiallyDeductible: number;
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
    totalDeductible: 0,
    fullyDeductible: 0,
    partiallyDeductible: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      console.log('📊 Loading dashboard...');

      // First check if there's a session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Session check:', session ? '✅ Found' : '❌ Not found');

      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User check:', user ? `✅ ${user.email}` : '❌ Not found');

      if (!user) {
        console.log('🚫 No user, waiting 5 seconds before redirect...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('🔄 Redirecting to signin now...');
        window.location.href = '/auth/signin';
        return;
      }

      console.log('✅ User authenticated, loading data...');

      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Try extended schema; fallback if column not present
      let { data: thisMonth, error: thisMonthErr } = await supabase
        .from('expenses')
        .select('amount, is_business, categories(deduction_percentage, is_tax_deductible)')
        .eq('user_id', user.id)
        .gte('date', firstDayThisMonth.toISOString().split('T')[0]);

      if (thisMonthErr) {
        const fallback = await supabase
          .from('expenses')
          .select('amount, is_business, categories(is_tax_deductible)')
          .eq('user_id', user.id)
          .gte('date', firstDayThisMonth.toISOString().split('T')[0]);
        thisMonth = fallback.data as any[] | null;
      }

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

      // Calculate tax deductible amounts
      let totalDeductible = 0;
      let fullyDeductible = 0;
      let partiallyDeductible = 0;

      thisMonth?.forEach((expense: any) => {
        const amount = Number(expense.amount);
        const deductionPercentage = (typeof expense.categories?.deduction_percentage === 'number')
          ? expense.categories?.deduction_percentage
          : (expense.categories?.is_tax_deductible ? 100 : 0);
        const deductibleAmount = (amount * deductionPercentage) / 100;

        totalDeductible += deductibleAmount;

        if (deductionPercentage === 100) {
          fullyDeductible += deductibleAmount;
        } else if (deductionPercentage > 0 && deductionPercentage < 100) {
          partiallyDeductible += deductibleAmount;
        }
      });

      setSummary({
        totalThisMonth,
        totalLastMonth,
        businessExpenses,
        personalExpenses,
        totalDeductible,
        fullyDeductible,
        partiallyDeductible,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <Navigation />
      <header className="bg-white shadow-md border-b-2 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your expense overview</p>
            </div>
            <div className="flex gap-3">
              <Link href="/expenses/new" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Expense
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-100">This Month</h3>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">${summary.totalThisMonth.toFixed(2)}</p>
            {percentChange !== 0 && (
              <div className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${percentChange > 0 ? 'bg-red-500/20 text-red-100' : 'bg-green-500/20 text-green-100'}`}>
                {percentChange > 0 ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}% vs last month
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600">Last Month</h3>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">${summary.totalLastMonth.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Previous period</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-green-100">Business</h3>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
            <p className="text-4xl font-bold mb-2">${summary.businessExpenses.toFixed(2)}</p>
            <p className="text-sm text-green-100">Tax deductible expenses</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-600">Personal</h3>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">${summary.personalExpenses.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Non-deductible</p>
          </div>
        </div>

        {/* Tax Deduction Summary */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Tax Deduction Summary</h2>
              <p className="text-purple-100 text-sm">IRS-compliant expense deductions for this month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Deductible</p>
              <p className="text-3xl font-bold">${summary.totalDeductible.toFixed(2)}</p>
              <p className="text-purple-100 text-xs mt-2">
                {summary.totalThisMonth > 0
                  ? `${((summary.totalDeductible / summary.totalThisMonth) * 100).toFixed(0)}% of total expenses`
                  : 'No expenses yet'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-purple-100 text-sm font-medium mb-1">100% Deductible</p>
              <p className="text-3xl font-bold">${summary.fullyDeductible.toFixed(2)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-500/30 text-green-100 text-xs rounded-full font-medium">
                  Fully Deductible
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-purple-100 text-sm font-medium mb-1">Partial Deductions</p>
              <p className="text-3xl font-bold">${summary.partiallyDeductible.toFixed(2)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-yellow-500/30 text-yellow-100 text-xs rounded-full font-medium">
                  50% & Other
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-purple-200 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-purple-100 text-sm">
                <strong>Tax Savings Estimate:</strong> Based on a 24% tax bracket, your deductible expenses could save you approximately <strong className="text-white">${(summary.totalDeductible * 0.24).toFixed(2)}</strong> in taxes this month.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
          <div className="px-6 py-5 border-b-2 border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            <Link href="/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
