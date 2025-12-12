'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/utils/supabase';

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
  job_id: string | null;
  jobs: { name: string } | null;
};

type TimeEntry = {
  id: string;
  entry_date: string;
  hours: number;
  hourly_rate: number | null;
  notes: string | null;
  job_id: string | null;
  jobs: { name: string } | null;
};

export default function ExpenseDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to view your SiteSense dashboard.');
        setLoading(false);
        return;
      }

      // Jobs (we're not filtering by user_id because jobs currently may not have it)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, name, client_name, status, created_at')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Expenses (linked to jobs where possible)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(
          `
          id,
          amount,
          description,
          date,
          job_id,
          jobs(name)
        `
        )
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20);

      if (expensesError) throw expensesError;

      setExpenses(
        (expensesData || []).map((e: any) => ({
          ...e,
          amount: Number(e.amount),
        }))
      );

      // Time entries (per user)
      const { data: timeData, error: timeError } = await supabase
        .from('time_entries')
        .select('id, entry_date, hours, hourly_rate, notes, job_id, jobs(name)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(20);

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
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Derived stats ----
  const activeJobs = jobs.filter((j) => (j.status || 'active') === 'active');
  const plannedJobs = jobs.filter((j) => j.status === 'planned');
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  // Time windows
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const hoursThisWeek = timeEntries
    .filter((t) => new Date(t.entry_date) >= startOfWeek)
    .reduce((sum, t) => sum + t.hours, 0);

  const laborThisMonth = timeEntries
    .filter((t) => new Date(t.entry_date) >= startOfMonth)
    .reduce((sum, t) => {
      if (!t.hourly_rate) return sum;
      return sum + t.hours * t.hourly_rate;
    }, 0);

  const expensesThisMonth = expenses
    .filter((e) => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalJobCostThisMonth = expensesThisMonth + laborThisMonth;

  const recentJobs = jobs.slice(0, 5);
  const recentExpenses = expenses.slice(0, 5);
  const recentTimeEntries = timeEntries.slice(0, 5);

  // ---- UI ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="sitesense" />
        <div className="flex items-center justify-center py-24">
          <p className="text-slate-300 text-sm">Loading your SiteSense dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation variant="sitesense" />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-red-300 text-sm">{error}</p>
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navigation variant="sitesense" />

      {/* Header */}
      <header className="border-b border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">SiteSense Dashboard</h1>
              <p className="text-sm text-slate-300 mt-1">
                Track active jobs, crew time, and costs in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold shadow-sm flex items-center gap-2 text-sm"
              >
                <span className="text-lg">🧱</span>
                View Jobs
              </Link>
              <Link
                href="/expenses/new"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm flex items-center gap-2 text-sm"
              >
                <span className="text-lg">➕</span>
                Add Expense
              </Link>
              <Link
                href="/jobs"
                className="px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-semibold shadow-sm flex items-center gap-2 text-sm"
              >
                <span className="text-lg">⏱️</span>
                Log Time (via Job)
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* KPI row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Active Jobs</p>
            <p className="mt-2 text-3xl font-bold text-white">{activeJobs.length}</p>
            <p className="mt-1 text-xs text-slate-400">
              {plannedJobs.length > 0 && `${plannedJobs.length} in planning`}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Hours This Week</p>
            <p className="mt-2 text-3xl font-bold text-white">{hoursThisWeek.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-400">From crew time entries</p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Job Costs This Month</p>
            <p className="mt-2 text-3xl font-bold text-purple-300">
              ${totalJobCostThisMonth.toFixed(2)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              ${expensesThisMonth.toFixed(2)} expenses · ${laborThisMonth.toFixed(2)} labor
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <p className="text-xs font-semibold text-slate-300 uppercase">Completed Jobs</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">
              {completedJobs.length}
            </p>
            <p className="mt-1 text-xs text-slate-400">Lifetime in SiteSense</p>
          </div>
        </section>

        {/* Main grid: Jobs primary, feeds secondary */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jobs list */}
          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
              <div>
                <h2 className="font-semibold text-white">Active & Recent Jobs</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Jobs with linked expenses and time entries show total cost.
                </p>
              </div>
              <Link
                href="/jobs"
                className="text-xs font-semibold text-blue-300 hover:text-blue-200"
              >
                View all jobs →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="p-6 text-sm text-slate-300">
                No jobs yet. Start by creating your first job on the{' '}
                <Link href="/jobs" className="text-blue-300 hover:text-blue-200">
                  Jobs page
                </Link>
                , then link expenses and time to it.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-slate-200 font-medium">
                        Job
                      </th>
                      <th className="px-4 py-2 text-left text-slate-200 font-medium">
                        Client
                      </th>
                      <th className="px-4 py-2 text-left text-slate-200 font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-slate-200 font-medium">
                        Est. Cost (month)
                      </th>
                      <th className="px-4 py-2 text-right text-slate-200 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJobs.map((job, idx) => {
                      // Rough per-job monthly cost: sum expenses + labor for this job this month
                      const jobExpenses = expenses.filter(
                        (e) =>
                          e.job_id === job.id &&
                          new Date(e.date) >= startOfMonth
                      );
                      const jobTime = timeEntries.filter(
                        (t) =>
                          t.job_id === job.id &&
                          new Date(t.entry_date) >= startOfMonth
                      );
                      const jobExpenseTotal = jobExpenses.reduce(
                        (sum, e) => sum + e.amount,
                        0
                      );
                      const jobLaborTotal = jobTime.reduce((sum, t) => {
                        if (!t.hourly_rate) return sum;
                        return sum + t.hours * t.hourly_rate;
                      }, 0);
                      const jobTotal = jobExpenseTotal + jobLaborTotal;

                      return (
                        <tr
                          key={job.id}
                          className={`border-t border-slate-700 ${
                            idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900/40'
                          }`}
                        >
                          <td className="px-4 py-2 font-medium text-slate-100">
                            {job.name}
                          </td>
                          <td className="px-4 py-2 text-slate-200">
                            {job.client_name || '—'}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                job.status === 'completed'
                                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                                  : job.status === 'planned'
                                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
                                  : 'bg-blue-400/20 text-blue-200 border border-blue-400/30'
                              }`}
                            >
                              {job.status || 'active'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-100">
                            ${jobTotal.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="text-xs font-semibold text-blue-300 hover:text-blue-200"
                            >
                              View details →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column: time + expenses feeds */}
          <div className="space-y-4">
            {/* Time feed */}
            <div className="rounded-xl border border-slate-700 bg-slate-800">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <h2 className="font-semibold text-white text-sm">
                  Recent Time Entries
                </h2>
                <Link
                  href="/time-tracking"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View all →
                </Link>
              </div>
              {recentTimeEntries.length === 0 ? (
                <div className="p-4 text-xs text-slate-300">
                  No time logged yet. Add time from any Job detail page.
                </div>
              ) : (
                <ul className="divide-y divide-slate-700 text-xs">
                  {recentTimeEntries.map((t) => (
                    <li key={t.id} className="px-4 py-2.5 flex justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-100">
                          {t.jobs?.name || 'Unassigned job'}
                        </p>
                        <p className="text-slate-300">
                          {new Date(t.entry_date).toLocaleDateString()} ·{' '}
                          {t.hours.toFixed(2)} hrs
                          {t.hourly_rate &&
                            ` @ $${t.hourly_rate.toFixed(2)}/hr`}
                        </p>
                        {t.notes && (
                          <p className="text-slate-300/90 line-clamp-2">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Expenses feed */}
            <div className="rounded-xl border border-slate-700 bg-slate-800">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <h2 className="font-semibold text-white text-sm">
                  Recent Expenses
                </h2>
                <Link
                  href="/expenses"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View all →
                </Link>
              </div>
              {recentExpenses.length === 0 ? (
                <div className="p-4 text-xs text-slate-300">
                  No expenses recorded yet. Add your first one to start tracking job
                  costs.
                </div>
              ) : (
                <ul className="divide-y divide-slate-700 text-xs">
                  {recentExpenses.map((e) => (
                    <li
                      key={e.id}
                      className="px-4 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-slate-100">
                          ${e.amount.toFixed(2)}{' '}
                          <span className="text-slate-300 font-normal">
                            · {e.description}
                          </span>
                        </p>
                        <p className="text-slate-300">
                          {new Date(e.date).toLocaleDateString()}
                          {e.jobs?.name &&
                            ` · Job: ${e.jobs.name}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
