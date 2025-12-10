'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type Job = {
  id: string;
  name: string;
  client_name: string | null;
  status: string | null;
  created_at: string;
};

type Expense = {
  id: string;
  amount: number;
  description: string;
  date: string;
  is_business: boolean;
  vendor: string | null;
  category: { name: string; icon: string; color: string } | null;
};

type TimeEntry = {
  id: string;
  entry_date: string;
  hours: number;
  hourly_rate: number | null;
  notes: string | null;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTime, setNewTime] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    hours: '',
    hourly_rate: '',
    notes: '',
  });
  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    void loadData();
  }, [jobId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in');
        setLoading(false);
        return;
      }

      // Load job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, name, client_name, status, created_at')
        .eq('id', jobId)
        .single();

      if (jobError || !jobData) {
        setError('Job not found');
        setLoading(false);
        return;
      }

      setJob(jobData as Job);

      // Load expenses for this job
      const { data: expenseData, error: expError } = await supabase
        .from('expenses')
        .select(
          `
          id,
          amount,
          description,
          date,
          is_business,
          vendor,
          categories(name, icon, color)
        `
        )
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .order('date', { ascending: false });

      if (expError) throw expError;

      const formattedExpenses: Expense[] = (expenseData || []).map((e: any) => ({
        ...e,
        category: e.categories || null,
      }));
      setExpenses(formattedExpenses);

      // Load time entries for this job
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('id, entry_date, hours, hourly_rate, notes')
        .eq('job_id', jobId)
        .order('entry_date', { ascending: false });

      if (timeError) throw timeError;

      setTimeEntries(
        (timeData || []).map((t: any) => ({
          ...t,
          hours: Number(t.hours),
          hourly_rate: t.hourly_rate !== null ? Number(t.hourly_rate) : null,
        }))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to load job details.');
    } finally {
      setLoading(false);
    }
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBusinessExpense = expenses
    .filter((e) => e.is_business)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalHours = timeEntries.reduce((sum, t) => sum + t.hours, 0);
  const totalLaborCost = timeEntries.reduce((sum, t) => {
    if (!t.hourly_rate) return sum;
    return sum + t.hours * t.hourly_rate;
  }, 0);

  const totalJobCost = totalExpense + totalLaborCost;

  async function handleAddTimeEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!jobId) return;

    const hours = parseFloat(newTime.hours || '0');
    const hourlyRate = newTime.hourly_rate ? parseFloat(newTime.hourly_rate) : null;

    if (!hours || hours <= 0) {
      alert('Enter hours > 0');
      return;
    }

    setSavingTime(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in');
        return;
      }

      const { error } = await supabase.from('time_entries').insert({
        job_id: jobId,
        user_id: user.id,
        entry_date: newTime.entry_date,
        hours,
        hourly_rate: hourlyRate,
        notes: newTime.notes || null,
      });

      if (error) throw error;

      setNewTime({
        entry_date: newTime.entry_date,
        hours: '',
        hourly_rate: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      alert('Failed to save time entry: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingTime(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-600">Loading job…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-red-600">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {job.client_name && <span>Client: {job.client_name} · </span>}
              <span className="capitalize">Status: {job.status || 'active'}</span>
            </p>
          </div>
          <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Jobs
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">${totalExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Business Expenses</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              ${totalBusinessExpense.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Hours Logged</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Total Job Cost</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              ${totalJobCost.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses */}
          <section className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-900">Expenses for this Job</h2>
              <Link
                href="/expenses/new"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Expense
              </Link>
            </div>
            {expenses.length === 0 ? (
              <div className="p-6 text-gray-500 text-sm">
                No expenses linked to this job yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600">Date</th>
                      <th className="px-4 py-2 text-left text-gray-600">Description</th>
                      <th className="px-4 py-2 text-left text-gray-600">Category</th>
                      <th className="px-4 py-2 text-left text-gray-600">Vendor</th>
                      <th className="px-4 py-2 text-right text-gray-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="px-4 py-2">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{e.description}</td>
                        <td className="px-4 py-2">
                          {e.category && (
                            <span className="inline-flex items-center gap-1">
                              <span>{e.category.icon}</span>
                              <span>{e.category.name}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">{e.vendor || '—'}</td>
                        <td className="px-4 py-2 text-right">
                          ${e.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Time tracking */}
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-gray-900">Time Entries</h2>
            </div>

            <form onSubmit={handleAddTimeEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newTime.entry_date}
                  onChange={(e) =>
                    setNewTime((prev) => ({ ...prev, entry_date: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Hours *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={newTime.hours}
                    onChange={(e) =>
                      setNewTime((prev) => ({ ...prev, hours: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Hourly Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTime.hourly_rate}
                    onChange={(e) =>
                      setNewTime((prev) => ({ ...prev, hourly_rate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newTime.notes}
                  onChange={(e) =>
                    setNewTime((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingTime}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {savingTime ? 'Saving…' : '+ Add Time Entry'}
              </button>
            </form>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-1">
                Total Hours:{' '}
                <span className="font-semibold text-gray-900">
                  {totalHours.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Labor Cost:{' '}
                <span className="font-semibold text-purple-700">
                  ${totalLaborCost.toFixed(2)}
                </span>
              </p>
            </div>

            {timeEntries.length > 0 && (
              <div className="border-t pt-3 max-h-60 overflow-y-auto text-xs">
                {timeEntries.map((t) => (
                  <div key={t.id} className="py-1 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <span>{new Date(t.entry_date).toLocaleDateString()}</span>
                      <span>{t.hours.toFixed(2)} hrs</span>
                    </div>
                    {t.hourly_rate && (
                      <div className="flex justify-between text-gray-500">
                        <span>@ ${t.hourly_rate.toFixed(2)}/hr</span>
                        <span>${(t.hourly_rate * t.hours).toFixed(2)}</span>
                      </div>
                    )}
                    {t.notes && (
                      <p className="text-gray-600 mt-0.5 line-clamp-2">{t.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

