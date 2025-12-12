'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type Job = {
  id: string;
  name: string;
  client_name: string | null;
  status: string | null;
  created_at: string;
  industries?: { name: string }[] | null;
};

type Industry = { id: string; name: string };

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('active');
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industryId, setIndustryId] = useState('');
  // Roofing-specific fields (optional)
  const [propertyAddress, setPropertyAddress] = useState('');
  const [structureType, setStructureType] = useState('');
  const [roofType, setRoofType] = useState('');
  const [roofPitch, setRoofPitch] = useState('');
  const [layers, setLayers] = useState('');
  const [squares, setSquares] = useState('');
  const [dumpsterSize, setDumpsterSize] = useState('');
  const [dumpsterHauler, setDumpsterHauler] = useState('');

  async function loadJobs() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('id, name, client_name, status, created_at, industries(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setError('Failed to load jobs.');
    } else {
      setJobs((data || []) as unknown as Job[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
    void loadIndustries();
  }, []);

  async function loadIndustries() {
    const { data, error } = await supabase
      .from('industries')
      .select('id, name')
      .order('name');
    if (!error && data) {
      setIndustries(data as Industry[]);
    }
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in first.');
      return;
    }

    const { error } = await supabase.from('jobs').insert({
      name: name.trim(),
      client_name: clientName.trim() || null,
      status: status || 'active',
      industry_id: industryId || null,
      user_id: user.id,
      property_address: propertyAddress || null,
      structure_type: structureType || null,
      roof_type: roofType || null,
      roof_pitch: roofPitch || null,
      layers: layers ? Number(layers) : null,
      measured_squares: squares ? Number(squares) : null,
      dumpster_size: dumpsterSize || null,
      dumpster_hauler: dumpsterHauler || null,
      // later: org_id, user_id, etc.
    });

    if (error) {
      console.error(error);
      setError('Failed to create job.');
      return;
    }

    setName('');
    setClientName('');
    setStatus('active');
    setIndustryId('');
    setPropertyAddress('');
    setStructureType('');
    setRoofType('');
    setRoofPitch('');
    setLayers('');
    setSquares('');
    setDumpsterSize('');
    setDumpsterHauler('');
    await loadJobs();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="sitesense" />

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create jobs and link expenses and time entries to track true job cost.
            </p>
          </div>

          <Link
            href="/expense-dashboard"
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Add Job form */}
        <section className="bg-white rounded-lg shadow p-5 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Job</h2>

          <form onSubmit={handleCreateJob} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Job Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Smith Driveway Resurface"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Client Name</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., John Smith"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Industry</label>
              <select
                value={industryId}
                onChange={(e) => setIndustryId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            {/* Roofing-specific quick fields */}
            {industries.find(i => i.id === industryId)?.name === 'Roofing' && (
              <>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Property Address</label>
                  <input
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St, City, ST"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Structure Type</label>
                  <input
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="House / Multi-family / Commercial"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Roof Type</label>
                  <input
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Shingle / Metal / Tile / Flat"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Roof Pitch</label>
                  <input
                    value={roofPitch}
                    onChange={(e) => setRoofPitch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 6/12"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Layers</label>
                  <input
                    type="number"
                    min="0"
                    value={layers}
                    onChange={(e) => setLayers(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Measured Squares</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={squares}
                    onChange={(e) => setSquares(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 28.5"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Dumpster Size</label>
                  <input
                    value={dumpsterSize}
                    onChange={(e) => setDumpsterSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 20 yd"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">Hauler</label>
                  <input
                    value={dumpsterHauler}
                    onChange={(e) => setDumpsterHauler(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Save Job
              </button>
            </div>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        {/* Jobs list */}
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">All Jobs</h2>
            {loading && <p className="text-xs text-gray-500">Loading…</p>}
          </div>

          {jobs.length === 0 && !loading ? (
            <div className="p-6 text-sm text-gray-500">
              No jobs yet. Add your first job above to start tracking expenses by job.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Job</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Client</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Industry</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Status</th>
                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Created</th>
                    <th className="px-4 py-2 text-right text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, idx) => (
                    <tr
                      key={job.id}
                      className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">{job.name}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {job.client_name || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {Array.isArray(job.industries) && job.industries.length > 0 ? job.industries[0].name : '—'}
                      </td>
                      <td className="px-4 py-2 capitalize">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'planned'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {job.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
