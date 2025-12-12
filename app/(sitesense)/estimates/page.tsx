'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type Row = { id: string; status: string; total: number; created_at: string; public_token: string; po_number: string | null; jobs: { name: string } | { name: string }[] | null };

export default function EstimatesListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRows([]); return; }
      const { data, error } = await supabase
        .from('estimates')
        .select('id, status, total, created_at, public_token, po_number, jobs(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRows((data || []).map((r: any) => ({ ...r, total: Number(r.total) })) as Row[]);
    } catch (err) {
      console.error('Failed to load estimates', err);
    } finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      ((Array.isArray(r.jobs) ? r.jobs[0]?.name : r.jobs?.name) || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.po_number || '').toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="sitesense" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">← Back to Jobs</Link>
        </div>
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by PO, job, status, or ID"
            className="w-full max-w-md px-3 py-2 border rounded"
          />
        </div>
        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">No estimates yet. Create one from any Job.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Job</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">PO #</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-2 text-right text-gray-600 font-medium">Total</th>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Created</th>
                  <th className="px-4 py-2 text-right text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={r.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-2">{Array.isArray(r.jobs) ? (r.jobs[0]?.name || '—') : (r.jobs?.name || '—')}</td>
                    <td className="px-4 py-2">{r.po_number || '—'}</td>
                    <td className="px-4 py-2 capitalize">{r.status}</td>
                    <td className="px-4 py-2 text-right">${r.total.toFixed(2)}</td>
                    <td className="px-4 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/estimates/${r.id}`} className="text-blue-600 hover:text-blue-700">Open</Link>
                      <a href={`/estimates/public/${r.public_token}`} className="text-gray-600 hover:text-gray-800" target="_blank">Public</a>
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
