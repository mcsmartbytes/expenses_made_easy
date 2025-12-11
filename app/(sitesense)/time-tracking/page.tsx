'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type TimeRow = {
  id: string;
  entry_date: string;
  hours: number;
  hourly_rate: number | null;
  notes: string | null;
  job_id: string | null;
  jobs: { name: string } | null;
};

export default function TimeTrackingPage() {
  const [rows, setRows] = useState<TimeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTime();
  }, []);

  async function loadTime() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('time_entries')
        .select('id, entry_date, hours, hourly_rate, notes, job_id, jobs(name)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      setRows(
        (data || []).map((t: any) => ({
          ...t,
          hours: Number(t.hours),
          hourly_rate: t.hourly_rate !== null ? Number(t.hourly_rate) : null,
        }))
      );
    } catch (err) {
      console.error('Error loading time entries:', err);
    } finally {
      setLoading(false);
    }
  }

  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalLaborCost = rows.reduce((s, r) => {
    if (!r.hourly_rate) return s;
    return s + r.hours * r.hourly_rate;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="sitesense" />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-600">Loading time entries…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="sitesense" />
      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
            <p className="text-sm text-gray-600 mt-1">
              Total hours:{' '}
              <span className="font-semibold">{totalHours.toFixed(2)}</span> · Labor cost:{' '}
              <span className="font-semibold">${totalLaborCost.toFixed(2)}</span>
            </p>
          </div>
          <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to Jobs
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
            No time entries yet. Add time from a Job Detail page.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Job</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Hours</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Rate</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <td className="px-4 py-2">
                      {new Date(r.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {r.job_id ? (
                        <Link
                          href={`/jobs/${r.job_id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {r.jobs?.name || '(Unknown job)'}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2">{r.hours.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {r.hourly_rate !== null ? `$${r.hourly_rate.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {r.notes ? <span className="line-clamp-2">{r.notes}</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
