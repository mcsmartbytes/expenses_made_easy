'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

type Expense = {
  id: string;
  amount: number;
  date: string;
  description: string;
  is_business: boolean;
};

type Budget = {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  profile: 'business' | 'personal';
  alert_threshold: number; // 0..1
};

export default function ExpensesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCategories, setHasCategories] = useState<boolean | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your Expenses dashboard.');
        setLoading(false);
        return;
      }

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data: expenseData, error: expErr } = await supabase
        .from('expenses')
        .select('id, amount, date, description, is_business')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .order('date', { ascending: false })
        .limit(50);
      if (expErr) throw expErr;

      setExpenses((expenseData || []).map((e: any) => ({ ...e, amount: Number(e.amount) })));

      const { data: budgetData, error: budErr } = await supabase
        .from('budgets')
        .select('id, category, amount, period, profile, alert_threshold')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('category');
      if (budErr) throw budErr;
      setBudgets((budgetData || []).map((b: any) => ({ ...b, amount: Number(b.amount) })));
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void checkCategories(); }, []);
  async function checkCategories() {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) setHasCategories((json.data || []).length > 0);
    } catch {
      setHasCategories(null);
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);
  const totalThisMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const businessThisMonth = monthExpenses.filter(e => e.is_business).reduce((s, e) => s + e.amount, 0);
  const personalThisMonth = monthExpenses.filter(e => !e.is_business).reduce((s, e) => s + e.amount, 0);

  const recentExpenses = monthExpenses.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="expenses" />
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-300 text-sm">Loading your Expenses dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="expenses" />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-red-300 text-sm">{error}</p>
          <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation variant="expenses" />
      <header className="border-b border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Expenses Dashboard</h1>
              <p className="text-sm text-slate-300 mt-1">Track spending, budgets, and receipts at a glance.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/expenses/new" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm text-sm">+ Add Expense</Link>
              <Link href="/budgets" className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-semibold shadow-sm text-sm">Manage Budgets</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Total This Month</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">${totalThisMonth.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Business</p>
            <p className="mt-2 text-3xl font-bold text-sky-400">${businessThisMonth.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Personal</p>
            <p className="mt-2 text-3xl font-bold text-indigo-300">${personalThisMonth.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Budgets Active</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">{budgets.length}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">Active Budgets</h2>
              <Link href="/budgets" className="text-xs font-semibold text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            {budgets.length === 0 ? (
              <div className="p-6 text-sm text-slate-300">No budgets set. Create one to track spending limits.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">Category</th>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">Type</th>
                      <th className="px-4 py-2 text-right text-slate-300 font-medium">Amount</th>
                      <th className="px-4 py-2 text-right text-slate-300 font-medium">Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.slice(0, 6).map((b, idx) => (
                      <tr key={b.id} className={`border-t border-slate-700 ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/70'}`}>
                        <td className="px-4 py-2 text-slate-100 font-medium">{b.category}</td>
                        <td className="px-4 py-2 text-slate-300 capitalize">{b.profile}</td>
                        <td className="px-4 py-2 text-right text-slate-100">${b.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-slate-300">{Math.round(b.alert_threshold * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">Recent Expenses</h2>
              <Link href="/expenses" className="text-xs font-semibold text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            {recentExpenses.length === 0 ? (
              <div className="p-4 text-sm text-slate-300">No expenses this month yet.</div>
            ) : (
              <ul className="divide-y divide-slate-700 text-sm">
                {recentExpenses.map((e) => (
                  <li key={e.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-100">
                        ${e.amount.toFixed(2)}{' '}
                        <span className="text-slate-300 font-normal">· {e.description}</span>
                      </p>
                      <p className="text-slate-400">
                        {new Date(e.date).toLocaleDateString()} · {e.is_business ? 'Business' : 'Personal'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Quick Start CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Track Mileage</h3>
              <p className="text-sm text-gray-600">Auto-start at 5 mph. Log business trips easily.</p>
            </div>
            <Link href="/mileage" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Open Mileage</Link>
          </div>
          {hasCategories === false && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900">Set Up Categories</h3>
                <p className="text-sm text-amber-800">Create defaults or pick your industry to get started.</p>
              </div>
              <Link href="/profile" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Open Profile</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
