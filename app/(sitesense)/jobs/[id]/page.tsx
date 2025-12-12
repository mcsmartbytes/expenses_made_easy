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
  industries?: { name: string }[] | null;
  property_address?: string | null;
  structure_type?: string | null;
  roof_type?: string | null;
  roof_pitch?: string | null;
  layers?: number | null;
  measured_squares?: number | null;
  dumpster_size?: string | null;
  dumpster_hauler?: string | null;
  safety_notes?: string | null;
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

type Phase = {
  id: string;
  name: string;
  sort_order: number;
  status: 'planned' | 'active' | 'blocked' | 'completed';
};

type Task = {
  id: string;
  phase_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  assignee: string | null;
  due_date: string | null;
  hours_estimate: number | null;
  sort_order: number;
  notes: string | null;
};

type Permit = {
  id: string;
  permit_number: string | null;
  authority: string | null;
  status: 'draft' | 'applied' | 'approved' | 'rejected' | 'closed';
  inspection_date: string | null;
};

type Material = {
  id: string;
  name: string;
  qty: number;
  unit: string | null;
  unit_cost: number | null;
  vendor: string | null;
};

type Photo = {
  id: string;
  url: string;
  kind: 'before' | 'during' | 'after' | 'other';
};

type WeatherDelay = {
  id: string;
  occurred_on: string;
  hours_lost: number | null;
  note: string | null;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [delays, setDelays] = useState<WeatherDelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTime, setNewTime] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    hours: '',
    hourly_rate: '',
    notes: '',
  });
  const [savingTime, setSavingTime] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [addingTaskForPhase, setAddingTaskForPhase] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskEdit, setTaskEdit] = useState<{ assignee: string; due_date: string }>({ assignee: '', due_date: '' });
  const [editingPermitId, setEditingPermitId] = useState<string | null>(null);
  const [permitEdit, setPermitEdit] = useState<{ permit_number: string; authority: string; inspection_date: string }>({ permit_number: '', authority: '', inspection_date: '' });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialEdit, setMaterialEdit] = useState<{ name: string; qty: string; unit: string; unit_cost: string; vendor: string }>({ name: '', qty: '1', unit: '', unit_cost: '', vendor: '' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  // Simple add forms
  const [newPermit, setNewPermit] = useState({ permit_number: '', authority: '', inspection_date: '' });
  const [newMaterial, setNewMaterial] = useState({ name: '', qty: '1', unit: '', unit_cost: '', vendor: '' });
  const [newPhoto, setNewPhoto] = useState({ url: '', kind: 'before' as Photo['kind'] });
  const [newDelay, setNewDelay] = useState({ occurred_on: new Date().toISOString().split('T')[0], hours_lost: '', note: '' });

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
        .select(`
          id, name, client_name, status, created_at,
          property_address, structure_type, roof_type, roof_pitch, layers, measured_squares,
          dumpster_size, dumpster_hauler, safety_notes,
          industries(name)
        `)
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

      // Load phases
      const { data: phaseData, error: phaseError } = await supabase
        .from('job_phases')
        .select('id, name, sort_order, status')
        .eq('job_id', jobId)
        .order('sort_order', { ascending: true });
      if (phaseError) throw phaseError;
      setPhases((phaseData || []) as Phase[]);

      // Load tasks for phases
      if (phaseData && phaseData.length > 0) {
        const phaseIds = (phaseData as any[]).map((p) => p.id);
        const { data: taskData, error: taskError } = await supabase
          .from('job_tasks')
          .select('id, phase_id, title, status, assignee, due_date, hours_estimate, sort_order, notes')
          .in('phase_id', phaseIds)
          .order('sort_order', { ascending: true });
        if (taskError) throw taskError;
        setTasks(
          (taskData || []).map((t: any) => ({
            ...t,
            hours_estimate: t.hours_estimate !== null ? Number(t.hours_estimate) : null,
          })) as Task[]
        );
      } else {
        setTasks([]);
      }

      // Permits
      const { data: permitData } = await supabase
        .from('permits')
        .select('id, permit_number, authority, status, inspection_date')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      setPermits((permitData || []) as Permit[]);

      // Materials
      const { data: materialData } = await supabase
        .from('job_materials')
        .select('id, name, qty, unit, unit_cost, vendor')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      setMaterials(
        (materialData || []).map((m: any) => ({
          ...m,
          qty: Number(m.qty),
          unit_cost: m.unit_cost !== null ? Number(m.unit_cost) : null,
        })) as Material[]
      );

      // Photos
      const { data: photoData } = await supabase
        .from('job_photos')
        .select('id, url, kind')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      setPhotos((photoData || []) as Photo[]);

      // Weather delays
      const { data: delayData } = await supabase
        .from('weather_delays')
        .select('id, occurred_on, hours_lost, note')
        .eq('job_id', jobId)
        .order('occurred_on', { ascending: false });
      setDelays(
        (delayData || []).map((d: any) => ({
          ...d,
          hours_lost: d.hours_lost !== null ? Number(d.hours_lost) : null,
        })) as WeatherDelay[]
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

  async function seedPhases() {
    if (!jobId) return;
    setSeeding(true);
    try {
      const { error } = await supabase.rpc('seed_phases_for_job', { p_job_id: jobId });
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Failed to seed phases: ' + (err.message || 'Unknown error'));
    } finally {
      setSeeding(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: Task['status']) {
    const { error } = await supabase
      .from('job_tasks')
      .update({ status })
      .eq('id', taskId);
    if (!error) await loadData();
  }

  async function addTask(phaseId: string) {
    if (!newTaskTitle.trim()) return;
    const { error } = await supabase
      .from('job_tasks')
      .insert({ phase_id: phaseId, title: newTaskTitle.trim(), status: 'todo' });
    if (error) {
      alert('Failed to add task');
      return;
    }
    setNewTaskTitle('');
    setAddingTaskForPhase(null);
    await loadData();
  }

  async function saveTaskEdit(taskId: string) {
    const { error } = await supabase
      .from('job_tasks')
      .update({ assignee: taskEdit.assignee || null, due_date: taskEdit.due_date || null })
      .eq('id', taskId);
    if (!error) {
      setEditingTaskId(null);
      await loadData();
    }
  }

  // Permits
  async function addPermit() {
    if (!jobId) return;
    const payload = {
      job_id: jobId,
      permit_number: newPermit.permit_number || null,
      authority: newPermit.authority || null,
      status: 'applied' as Permit['status'],
      inspection_date: newPermit.inspection_date || null,
    };
    const { error } = await supabase.from('permits').insert(payload);
    if (error) {
      alert('Failed to add permit');
      return;
    }
    setNewPermit({ permit_number: '', authority: '', inspection_date: '' });
    await loadData();
  }
  async function deletePermit(id: string) {
    const { error } = await supabase.from('permits').delete().eq('id', id);
    if (!error) await loadData();
  }

  // Materials
  async function addMaterial() {
    if (!jobId || !newMaterial.name.trim()) return;
    const { error } = await supabase.from('job_materials').insert({
      job_id: jobId,
      name: newMaterial.name.trim(),
      qty: newMaterial.qty ? Number(newMaterial.qty) : 1,
      unit: newMaterial.unit || null,
      unit_cost: newMaterial.unit_cost ? Number(newMaterial.unit_cost) : null,
      vendor: newMaterial.vendor || null,
    });
    if (error) {
      alert('Failed to add material');
      return;
    }
    setNewMaterial({ name: '', qty: '1', unit: '', unit_cost: '', vendor: '' });
    await loadData();
  }
  async function deleteMaterial(id: string) {
    const { error } = await supabase.from('job_materials').delete().eq('id', id);
    if (!error) await loadData();
  }

  // Photos
  async function addPhoto() {
    if (!jobId || !newPhoto.url.trim()) return;
    const { error } = await supabase.from('job_photos').insert({
      job_id: jobId,
      url: newPhoto.url.trim(),
      kind: newPhoto.kind,
    });
    if (error) {
      alert('Failed to add photo');
      return;
    }
    setNewPhoto({ url: '', kind: 'before' });
    await loadData();
  }
  async function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[1] ? null : e.target.files?.[0] || null; // single
    setPhotoFile(f || null);
  }

  async function uploadPhotoToStorage() {
    if (!photoFile || !jobId) return;
    try {
      setUploadingPhoto(true);
      const path = `${jobId}/${Date.now()}_${photoFile.name}`;
      const { error: upErr } = await supabase.storage.from('job-photos').upload(path, photoFile, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('job-photos').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error } = await supabase.from('job_photos').insert({ job_id: jobId, url: publicUrl, kind: newPhoto.kind });
      if (error) throw error;
      setPhotoFile(null);
      await loadData();
    } catch (err: any) {
      alert('Upload failed (ensure bucket job-photos exists and is public): ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function savePermitEditRow(id: string) {
    const { error } = await supabase
      .from('permits')
      .update({
        permit_number: permitEdit.permit_number || null,
        authority: permitEdit.authority || null,
        inspection_date: permitEdit.inspection_date || null,
      })
      .eq('id', id);
    if (!error) {
      setEditingPermitId(null);
      await loadData();
    }
  }

  async function saveMaterialEditRow(id: string) {
    const { error } = await supabase
      .from('job_materials')
      .update({
        name: materialEdit.name.trim() || null,
        qty: materialEdit.qty ? Number(materialEdit.qty) : null,
        unit: materialEdit.unit || null,
        unit_cost: materialEdit.unit_cost ? Number(materialEdit.unit_cost) : null,
        vendor: materialEdit.vendor || null,
      })
      .eq('id', id);
    if (!error) {
      setEditingMaterialId(null);
      await loadData();
    }
  }
  async function deletePhoto(id: string) {
    const { error } = await supabase.from('job_photos').delete().eq('id', id);
    if (!error) await loadData();
  }

  async function addDelay() {
    if (!jobId || !newDelay.occurred_on) return;
    const { error } = await supabase.from('weather_delays').insert({
      job_id: jobId,
      occurred_on: newDelay.occurred_on,
      hours_lost: newDelay.hours_lost ? Number(newDelay.hours_lost) : null,
      note: newDelay.note || null,
    });
    if (error) {
      alert('Failed to add weather delay');
      return;
    }
    setNewDelay({ occurred_on: new Date().toISOString().split('T')[0], hours_lost: '', note: '' });
    await loadData();
  }
  async function deleteDelay(id: string) {
    const { error } = await supabase.from('weather_delays').delete().eq('id', id);
    if (!error) await loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="sitesense" />
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-600">Loading job…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="sitesense" />
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
      <Navigation variant="sitesense" />
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {job.client_name && <span>Client: {job.client_name} · </span>}
              {Array.isArray(job.industries) && job.industries.length > 0 && (
                <span>Industry: {job.industries[0].name} · </span>
              )}
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
            <p className="text-2xl font-bold text-blue-700 mt-1">${totalBusinessExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Hours Logged</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalHours.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase">Total Job Cost</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">${totalJobCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expenses */}
          <section className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-900">Expenses for this Job</h2>
              <Link href="/expenses/new" className="text-sm text-blue-600 hover:text-blue-700">+ Add Expense</Link>
            </div>
            {expenses.length === 0 ? (
              <div className="p-6 text-gray-500 text-sm">No expenses linked to this job yet.</div>
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
                        <td className="px-4 py-2">{new Date(e.date).toLocaleDateString()}</td>
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
                        <td className="px-4 py-2 text-right">${e.amount.toFixed(2)}</td>
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
                <input type="date" value={newTime.entry_date} onChange={(e) => setNewTime((prev) => ({ ...prev, entry_date: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Hours *</label>
                  <input type="number" step="0.25" min="0" required value={newTime.hours} onChange={(e) => setNewTime((prev) => ({ ...prev, hours: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Hourly Rate</label>
                  <input type="number" step="0.01" min="0" value={newTime.hourly_rate} onChange={(e) => setNewTime((prev) => ({ ...prev, hourly_rate: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="optional" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Notes</label>
                <textarea rows={2} value={newTime.notes} onChange={(e) => setNewTime((prev) => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" disabled={savingTime} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {savingTime ? 'Saving…' : '+ Add Time Entry'}
              </button>
            </form>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-1">Total Hours: <span className="font-semibold text-gray-900">{totalHours.toFixed(2)}</span></p>
              <p className="text-xs text-gray-500">Labor Cost: <span className="font-semibold text-purple-700">${totalLaborCost.toFixed(2)}</span></p>
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

        {/* Phases & Tasks */}
        <section className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Project Phases</h2>
              <p className="text-xs text-gray-500">Track progress from intake to closeout.</p>
            </div>
            <button onClick={seedPhases} disabled={seeding || phases.length > 0} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50" title={phases.length > 0 ? 'Phases already exist' : 'Seed from industry templates'}>
              {seeding ? 'Seeding…' : phases.length > 0 ? 'Phases Ready' : 'Seed Phases'}
            </button>
          </div>

          {phases.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No phases yet. Click "Seed Phases" to add the standard workflow.</div>
          ) : (
            <div className="divide-y">
              {phases.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'completed' ? 'bg-green-100 text-green-800' :
                        p.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        p.status === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <button onClick={() => { setAddingTaskForPhase(p.id); setNewTaskTitle(''); }} className="text-sm text-blue-600 hover:text-blue-700">+ Add Task</button>
                  </div>

                  <ul className="space-y-2">
                    {tasks.filter(t => t.phase_id === p.id).map((t) => (
                      <li key={t.id} className="bg-gray-50 rounded p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-800">{t.title}</p>
                            {editingTaskId === t.id ? (
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <input value={taskEdit.assignee} onChange={(e) => setTaskEdit({ ...taskEdit, assignee: e.target.value })} placeholder="Assignee" className="px-2 py-1 border rounded" />
                                <input type="date" value={taskEdit.due_date} onChange={(e) => setTaskEdit({ ...taskEdit, due_date: e.target.value })} className="px-2 py-1 border rounded" />
                                <button onClick={() => saveTaskEdit(t.id)} className="px-2 py-1 bg-blue-600 text-white rounded">Save</button>
                                <button onClick={() => setEditingTaskId(null)} className="px-2 py-1 bg-gray-200 text-gray-700 rounded">Cancel</button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">{t.assignee ? `Assignee: ${t.assignee} · ` : ''}{t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : ''}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value as Task['status'])} className="text-sm px-2 py-1 border rounded">
                              <option value="todo">To do</option>
                              <option value="in_progress">In progress</option>
                              <option value="blocked">Blocked</option>
                              <option value="done">Done</option>
                            </select>
                            <button onClick={() => { setEditingTaskId(t.id); setTaskEdit({ assignee: t.assignee || '', due_date: t.due_date || '' }); }} className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {addingTaskForPhase === p.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" className="flex-1 px-3 py-2 border rounded" />
                      <button onClick={() => addTask(p.id)} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
                      <button onClick={() => { setAddingTaskForPhase(null); setNewTaskTitle(''); }} className="px-3 py-2 bg-gray-200 text-gray-700 rounded">Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Permits */}
        <section className="bg-white rounded-lg shadow mt-6">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Permits</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input placeholder="Permit Number" value={newPermit.permit_number} onChange={(e) => setNewPermit({ ...newPermit, permit_number: e.target.value })} className="px-3 py-2 border rounded" />
              <input placeholder="Authority" value={newPermit.authority} onChange={(e) => setNewPermit({ ...newPermit, authority: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="date" value={newPermit.inspection_date} onChange={(e) => setNewPermit({ ...newPermit, inspection_date: e.target.value })} className="px-3 py-2 border rounded" title="Inspection Date" />
              <button onClick={addPermit} className="px-3 py-2 bg-blue-600 text-white rounded">Add Permit</button>
            </div>

            {permits.length === 0 ? (
              <p className="text-sm text-gray-500">No permits yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Number</th>
                      <th className="px-3 py-2 text-left">Authority</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Inspection</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">
                          {editingPermitId === p.id ? (
                            <input className="px-2 py-1 border rounded w-full" value={permitEdit.permit_number} onChange={(e) => setPermitEdit({ ...permitEdit, permit_number: e.target.value })} />
                          ) : (
                            p.permit_number || '—'
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingPermitId === p.id ? (
                            <input className="px-2 py-1 border rounded w-full" value={permitEdit.authority} onChange={(e) => setPermitEdit({ ...permitEdit, authority: e.target.value })} />
                          ) : (
                            p.authority || '—'
                          )}
                        </td>
                        <td className="px-3 py-2 capitalize">{p.status}</td>
                        <td className="px-3 py-2">
                          {editingPermitId === p.id ? (
                            <input type="date" className="px-2 py-1 border rounded w-full" value={permitEdit.inspection_date} onChange={(e) => setPermitEdit({ ...permitEdit, inspection_date: e.target.value })} />
                          ) : (
                            p.inspection_date ? new Date(p.inspection_date).toLocaleDateString() : '—'
                          )}
                        </td>
                        <td className="px-3 py-2 text-right space-x-3">
                          {editingPermitId === p.id ? (
                            <>
                              <button onClick={() => savePermitEditRow(p.id)} className="text-blue-600 hover:text-blue-700">Save</button>
                              <button onClick={() => setEditingPermitId(null)} className="text-gray-600 hover:text-gray-700">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingPermitId(p.id); setPermitEdit({ permit_number: p.permit_number || '', authority: p.authority || '', inspection_date: p.inspection_date || '' }); }} className="text-blue-600 hover:text-blue-700">Edit</button>
                              <button onClick={() => deletePermit(p.id)} className="text-red-600 hover:text-red-700">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Materials / BOM */}
        <section className="bg-white rounded-lg shadow mt-6">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Materials / BOM</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <input placeholder="Material name" value={newMaterial.name} onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })} className="px-3 py-2 border rounded md:col-span-2" />
              <input type="number" min="0" step="0.01" placeholder="Qty" value={newMaterial.qty} onChange={(e) => setNewMaterial({ ...newMaterial, qty: e.target.value })} className="px-3 py-2 border rounded" />
              <input placeholder="Unit (e.g., sq, roll)" value={newMaterial.unit} onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })} className="px-3 py-2 border rounded" />
              <input type="number" step="0.01" min="0" placeholder="Unit Cost" value={newMaterial.unit_cost} onChange={(e) => setNewMaterial({ ...newMaterial, unit_cost: e.target.value })} className="px-3 py-2 border rounded" />
              <input placeholder="Vendor" value={newMaterial.vendor} onChange={(e) => setNewMaterial({ ...newMaterial, vendor: e.target.value })} className="px-3 py-2 border rounded" />
              <button onClick={addMaterial} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
            </div>

            {materials.length === 0 ? (
              <p className="text-sm text-gray-500">No materials yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-left">Unit Cost</th>
                      <th className="px-3 py-2 text-left">Vendor</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-3 py-2">{m.name}</td>
                        <td className="px-3 py-2">{m.qty}</td>
                        <td className="px-3 py-2">{m.unit || '—'}</td>
                        <td className="px-3 py-2">{m.unit_cost !== null ? `$${m.unit_cost.toFixed(2)}` : '—'}</td>
                        <td className="px-3 py-2">{m.vendor || '—'}</td>
                        <td className="px-3 py-2 text-right space-x-3">
                          {editingMaterialId === m.id ? (
                            <>
                              <button onClick={() => saveMaterialEditRow(m.id)} className="text-blue-600 hover:text-blue-700">Save</button>
                              <button onClick={() => setEditingMaterialId(null)} className="text-gray-600 hover:text-gray-700">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingMaterialId(m.id); setMaterialEdit({ name: m.name, qty: String(m.qty), unit: m.unit || '', unit_cost: m.unit_cost !== null ? String(m.unit_cost) : '', vendor: m.vendor || '' }); }} className="text-blue-600 hover:text-blue-700">Edit</button>
                              <button onClick={() => deleteMaterial(m.id)} className="text-red-600 hover:text-red-700">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Estimates */}
        <section className="bg-white rounded-lg shadow mt-6">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Estimates</h2>
            <Link href={`/estimates/new/${job.id}`} className="text-sm text-blue-600 hover:text-blue-700">+ New Estimate</Link>
          </div>
          <div className="p-4 text-sm text-gray-500">
            Create professional estimates with optional add-ons and photo attachments.
          </div>
        </section>

        {/* Photos */}
        <section className="bg-white rounded-lg shadow mt-6">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Photos</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Image URL" value={newPhoto.url} onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })} className="px-3 py-2 border rounded md:col-span-2" />
              <select value={newPhoto.kind} onChange={(e) => setNewPhoto({ ...newPhoto, kind: e.target.value as Photo['kind'] })} className="px-3 py-2 border rounded">
                <option value="before">Before</option>
                <option value="during">During</option>
                <option value="after">After</option>
                <option value="other">Other</option>
              </select>
              <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="px-3 py-2 border rounded" />
              <div className="flex gap-2">
                <button onClick={addPhoto} className="px-3 py-2 bg-blue-600 text-white rounded">Add by URL</button>
                <button onClick={uploadPhotoToStorage} disabled={uploadingPhoto || !photoFile} className="px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-50">{uploadingPhoto ? 'Uploading…' : 'Upload File'}</button>
              </div>
            </div>

            {photos.length === 0 ? (
              <p className="text-sm text-gray-500">No photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="bg-gray-50 rounded border overflow-hidden">
                    <div className="aspect-[4/3] bg-gray-100">
                      <img src={p.url} alt={p.kind} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 flex items-center justify-between text-xs text-gray-700">
                      <span className="capitalize">{p.kind}</span>
                      <button onClick={() => deletePhoto(p.id)} className="text-red-600 hover:text-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Weather Delays */}
        <section className="bg-white rounded-lg shadow mt-6">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Weather Delays</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input type="date" value={newDelay.occurred_on} onChange={(e) => setNewDelay({ ...newDelay, occurred_on: e.target.value })} className="px-3 py-2 border rounded" title="Date" />
              <input type="number" min="0" step="0.25" placeholder="Hours Lost" value={newDelay.hours_lost} onChange={(e) => setNewDelay({ ...newDelay, hours_lost: e.target.value })} className="px-3 py-2 border rounded" />
              <input placeholder="Note" value={newDelay.note} onChange={(e) => setNewDelay({ ...newDelay, note: e.target.value })} className="px-3 py-2 border rounded md:col-span-1" />
              <button onClick={addDelay} className="px-3 py-2 bg-blue-600 text-white rounded">Add Delay</button>
            </div>

            {delays.length === 0 ? (
              <p className="text-sm text-gray-500">No weather delays logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Hours Lost</th>
                      <th className="px-3 py-2 text-left">Note</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delays.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{new Date(d.occurred_on).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{d.hours_lost !== null ? d.hours_lost.toFixed(2) : '—'}</td>
                        <td className="px-3 py-2">{d.note || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => deleteDelay(d.id)} className="text-red-600 hover:text-red-700">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
