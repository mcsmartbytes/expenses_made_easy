'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type Item = { id: string; description: string; qty: string; unit_price: string; is_optional: boolean };

export default function NewEstimatePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [jobName, setJobName] = useState('');
  const [items, setItems] = useState<Item[]>([{ id: crypto.randomUUID(), description: '', qty: '1', unit_price: '0', is_optional: false }]);
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void loadJob(); }, [jobId]);
  async function loadJob() {
    const { data } = await supabase.from('jobs').select('name').eq('id', jobId).single();
    if (data?.name) setJobName(data.name);
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty || '0') * parseFloat(it.unit_price || '0')), 0);
    return { subtotal, tax: 0, total: subtotal };
  }, [items]);

  function updateItem(id: string, patch: Partial<Item>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }
  function addItem() { setItems(prev => [...prev, { id: crypto.randomUUID(), description: '', qty: '1', unit_price: '0', is_optional: false }]); }
  function removeItem(id: string) { setItems(prev => prev.filter(i => i.id !== id)); }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Please sign in'); return; }

      const { data: estData, error: estErr } = await supabase
        .from('estimates')
        .insert({ job_id: jobId, user_id: user.id, status: 'draft', notes: notes || null, expires_at: expiresAt || null, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, po_number: poNumber || null })
        .select('id, public_token')
        .single();
      if (estErr) throw estErr;

      const estimateId = estData.id as string;

      if (items.length > 0) {
        const rows = items.map((it, idx) => ({ estimate_id: estimateId, description: it.description, qty: parseFloat(it.qty || '0'), unit_price: parseFloat(it.unit_price || '0'), is_optional: it.is_optional, sort_order: idx }));
        const { error } = await supabase.from('estimate_items').insert(rows);
        if (error) throw error;
      }

      if (attachments.length > 0) {
        const toInsert: { estimate_id: string; url: string; kind: 'photo' }[] = [];
        for (const file of attachments) {
          const path = `${estimateId}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from('estimate-attachments').upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from('estimate-attachments').getPublicUrl(path);
          toInsert.push({ estimate_id: estimateId, url: data.publicUrl, kind: 'photo' });
        }
        const { error } = await supabase.from('estimate_attachments').insert(toInsert as any);
        if (error) throw error;
      }

      router.push(`/estimates/${estimateId}`);
    } catch (err: any) {
      alert('Failed to save estimate: ' + (err.message || 'Unknown error'));
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="sitesense" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Estimate</h1>
            <p className="text-sm text-gray-600">Job: {jobName || jobId}</p>
          </div>
          <Link href={`/jobs/${jobId}`} className="text-blue-600 hover:text-blue-700">← Back to Job</Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Expires On</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Optional message" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">PO Number</label>
              <input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g. PO-12345" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                  <input value={it.description} onChange={(e) => updateItem(it.id, { description: e.target.value })} className="md:col-span-3 px-3 py-2 border rounded" placeholder="Description" />
                  <input type="number" step="0.01" min="0" value={it.qty} onChange={(e) => updateItem(it.id, { qty: e.target.value })} className="px-3 py-2 border rounded" placeholder="Qty" />
                  <input type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => updateItem(it.id, { unit_price: e.target.value })} className="px-3 py-2 border rounded" placeholder="Unit Price" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={it.is_optional} onChange={(e) => updateItem(it.id, { is_optional: e.target.checked })} /> Optional
                  </label>
                  <button onClick={() => removeItem(it.id)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Attachments</h2>
            <input type="file" multiple accept="image/*" onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
            <p className="text-xs text-gray-500 mt-1">Uploads go to the 'estimate-attachments' storage bucket.</p>
          </div>

          <div className="flex justify-end gap-4 items-center border-t pt-4">
            <div className="text-right text-sm text-gray-700">
              <div>Subtotal: <span className="font-semibold">${totals.subtotal.toFixed(2)}</span></div>
              <div>Tax: <span className="font-semibold">${totals.tax.toFixed(2)}</span></div>
              <div>Total: <span className="font-bold text-gray-900">${totals.total.toFixed(2)}</span></div>
            </div>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50">{saving ? 'Saving…' : 'Save Estimate'}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
