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
  category_id?: string;
  category: {
    name: string;
    icon: string;
    color: string;
  } | null;
  job_id?: string | null;
  job_name?: string | null;
  po_number?: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Job {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'business' | 'personal'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [jobFilterId, setJobFilterId] = useState<string>('');
  const [query, setQuery] = useState('');

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: '',
    vendor: '',
    payment_method: 'credit',
    is_business: true,
    notes: '',
    job_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadJobs();
  }, []);

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpense) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(editFormData.amount || '0'),
          description: editFormData.description,
          category_id: editFormData.category_id || null,
          date: editFormData.date,
          vendor: editFormData.vendor || null,
          payment_method: editFormData.payment_method || null,
          is_business: editFormData.is_business,
          notes: editFormData.notes || null,
          job_id: editFormData.job_id || null,
        })
        .eq('id', editingExpense.id);
      if (error) throw error;

      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? {
        ...e,
        amount: parseFloat(editFormData.amount || '0'),
        description: editFormData.description,
        category_id: editFormData.category_id || undefined,
        date: editFormData.date,
        vendor: editFormData.vendor || null,
        payment_method: editFormData.payment_method || undefined,
        is_business: editFormData.is_business,
        notes: editFormData.notes || undefined,
        job_id: editFormData.job_id || null,
      } : e));
      setEditingExpense(null);
    } catch (err) {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function loadJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  }

  async function loadExpenses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(
          `
            id,
            amount,
            description,
            date,
            vendor,
            is_business,
            payment_method,
            notes,
            category_id,
            po_number,
            job_id,
            categories(name, icon, color),
            jobs(name)
          `
        )
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses: Expense[] = (data || []).map((exp: any) => ({
        ...exp,
        category: exp.categories || null,
        job_name: exp.jobs?.name ?? null,
        po_number: exp.po_number ?? null,
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete expense');
      // no-op
    }
  }

  function getFilteredExpenses() {
    let filtered = expenses;
    if (filterType === 'business') filtered = filtered.filter(e => e.is_business);
    else if (filterType === 'personal') filtered = filtered.filter(e => !e.is_business);

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

    if (jobFilterId) {
      filtered = filtered.filter(e => e.job_id === jobFilterId);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(e =>
        (e.description || '').toLowerCase().includes(q) ||
        (e.vendor || '').toLowerCase().includes(q) ||
        (e.po_number || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  function exportToCSV() {
    const filteredExpenses = getFilteredExpenses();
    if (filteredExpenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Job', 'Vendor', 'Type', 'Payment Method', 'Amount', 'Notes'];
    const rows = filteredExpenses.map(expense => [
      expense.date,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.category?.name || '',
      expense.job_name || '',
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
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="expenses" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="expenses" />
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
          <div className="flex flex-wrap gap-3">
              <button onClick={exportToCSV} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <Link href="/expenses/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">+ Add Expense</Link>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search description, vendor, PO"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Types</option>
                  <option value="business">Business Only</option>
                  <option value="personal">Personal Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Job</label>
                <select value={jobFilterId} onChange={(e) => setJobFilterId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-3 gap-4 text-sm min-w-[300px]">
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-semibold text-gray-900">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Business</p>
                <p className="font-semibold text-blue-700">${businessTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Personal</p>
                <p className="font-semibold text-gray-900">${personalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            No expenses found for the selected filters.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {expense.category && (
                        <span className="inline-flex items-center gap-1">
                          <span>{expense.category.icon}</span>
                          <span>{expense.category.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.job_name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.po_number || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{expense.vendor || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${expense.is_business ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {expense.is_business ? 'Business' : 'Personal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">${expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                      <button onClick={() => setEditingExpense(expense)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => deleteExpense(expense.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredExpenses.length} of {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            {filterType !== 'all' || dateRange !== 'all' || jobFilterId ? ' (filtered)' : ''}
          </p>
          <Link href="/expenses/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold">Back to Dashboard</Link>
        </div>
      </main>

      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Expense</h2>
                <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">$</span>
                    <input type="number" step="0.01" required value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input type="text" required value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={editFormData.category_id} onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input type="date" required value={editFormData.date} onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input type="text" value={editFormData.vendor} onChange={(e) => setEditFormData({ ...editFormData, vendor: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select value={editFormData.payment_method} onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={editFormData.is_business} onChange={(e) => setEditFormData({ ...editFormData, is_business: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-sm font-medium">This is a business expense</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Job</label>
                  <select value={editFormData.job_id} onChange={(e) => setEditFormData({ ...editFormData, job_id: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">No job / general expense</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
