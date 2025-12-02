'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface RecurringExpense {
  id: string;
  amount: number;
  description: string;
  category_id: string | null;
  vendor: string | null;
  payment_method: string;
  is_business: boolean;
  notes: string | null;
  frequency: string;
  start_date: string;
  next_due_date: string;
  last_generated_date: string | null;
  is_active: boolean;
  categories: {
    name: string;
    icon: string;
    color: string;
  } | null;
}

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

export default function RecurringExpensesPage() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    vendor: '',
    payment_method: 'credit',
    is_business: true,
    notes: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    initializeData();
  }, []);

  async function initializeData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await Promise.all([
        loadRecurringExpenses(user.id),
        loadCategories(),
      ]);
    }
    setLoading(false);
  }

  async function loadRecurringExpenses(uid: string) {
    try {
      const response = await fetch(`/api/recurring-expenses?user_id=${uid}`);
      const result = await response.json();
      if (result.success) {
        setRecurringExpenses(result.data || []);
      }
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  function resetForm() {
    setFormData({
      amount: '',
      description: '',
      category_id: '',
      vendor: '',
      payment_method: 'credit',
      is_business: true,
      notes: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
    });
  }

  function openAddForm() {
    resetForm();
    setEditingExpense(null);
    setShowAddForm(true);
  }

  function openEditForm(expense: RecurringExpense) {
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category_id: expense.category_id || '',
      vendor: expense.vendor || '',
      payment_method: expense.payment_method,
      is_business: expense.is_business,
      notes: expense.notes || '',
      frequency: expense.frequency,
      start_date: expense.start_date,
    });
    setEditingExpense(expense);
    setShowAddForm(true);
  }

  function closeForm() {
    setShowAddForm(false);
    setEditingExpense(null);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      if (editingExpense) {
        // Update existing
        const response = await fetch('/api/recurring-expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingExpense.id,
            ...formData,
            amount: parseFloat(formData.amount),
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      } else {
        // Create new
        const response = await fetch('/api/recurring-expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ...formData,
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      }

      closeForm();
      await loadRecurringExpenses(userId);
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(expense: RecurringExpense) {
    try {
      const response = await fetch('/api/recurring-expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expense.id,
          is_active: !expense.is_active,
        }),
      });
      const result = await response.json();
      if (result.success && userId) {
        await loadRecurringExpenses(userId);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Delete this recurring expense? This will not delete any expenses already generated.')) return;

    try {
      const response = await fetch(`/api/recurring-expenses?id=${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success && userId) {
        await loadRecurringExpenses(userId);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  function getFrequencyLabel(freq: string) {
    return FREQUENCIES.find(f => f.value === freq)?.label || freq;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }

  function getDaysUntilDue(nextDueDate: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(nextDueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  // Calculate upcoming expenses for next 30 days
  function getUpcomingExpenses() {
    const upcoming: { expense: RecurringExpense; dueDate: string; daysUntil: number }[] = [];

    recurringExpenses
      .filter(e => e.is_active)
      .forEach(expense => {
        const daysUntil = getDaysUntilDue(expense.next_due_date);
        if (daysUntil <= 30) {
          upcoming.push({
            expense,
            dueDate: expense.next_due_date,
            daysUntil,
          });
        }
      });

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  const upcomingExpenses = getUpcomingExpenses();
  const totalMonthlyAmount = recurringExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => {
      switch (e.frequency) {
        case 'weekly': return sum + (e.amount * 4.33);
        case 'biweekly': return sum + (e.amount * 2.17);
        case 'monthly': return sum + e.amount;
        case 'quarterly': return sum + (e.amount / 3);
        case 'annually': return sum + (e.amount / 12);
        default: return sum + e.amount;
      }
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Expenses</h1>
            <p className="text-gray-600 mt-1">Manage your recurring bills and subscriptions</p>
          </div>
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            + Add Recurring Expense
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Active Recurring</p>
            <p className="text-3xl font-bold text-gray-900">
              {recurringExpenses.filter(e => e.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Est. Monthly Total</p>
            <p className="text-3xl font-bold text-blue-600">
              ${totalMonthlyAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Due in Next 7 Days</p>
            <p className="text-3xl font-bold text-orange-600">
              {upcomingExpenses.filter(u => u.daysUntil <= 7).length}
            </p>
          </div>
        </div>

        {/* Upcoming Expenses Preview */}
        {upcomingExpenses.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Upcoming (Next 30 Days)</h2>
            </div>
            <div className="divide-y">
              {upcomingExpenses.map(({ expense, dueDate, daysUntil }) => (
                <div key={`upcoming-${expense.id}`} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{expense.categories?.icon || '📋'}</span>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(dueDate)} ({daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`})
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${daysUntil <= 3 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : 'text-gray-900'}`}>
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Recurring Expenses */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">All Recurring Expenses</h2>
          </div>

          {recurringExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No recurring expenses set up yet</p>
              <button
                onClick={openAddForm}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Add Your First Recurring Expense
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {recurringExpenses.map((expense) => (
                <div key={expense.id} className={`px-6 py-4 ${!expense.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{expense.categories?.icon || '📋'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{expense.description}</p>
                          {!expense.is_active && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Paused</span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            expense.is_business ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {expense.is_business ? 'Business' : 'Personal'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {expense.vendor && `${expense.vendor} • `}
                          {getFrequencyLabel(expense.frequency)} • Next: {formatDate(expense.next_due_date)}
                        </p>
                        {expense.categories && (
                          <p className="text-xs text-gray-500 mt-1">
                            Category: {expense.categories.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(expense)}
                          className={`px-3 py-1 rounded text-sm ${
                            expense.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {expense.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => openEditForm(expense)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingExpense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
                </h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Netflix Subscription"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Frequency *</label>
                    <select
                      required
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Netflix, Spotify"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_business}
                      onChange={(e) => setFormData({ ...formData, is_business: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">This is a business expense</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Recurring Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
