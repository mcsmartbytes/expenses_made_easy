'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase';

type Estimate = { id: string; notes: string | null; status: string; subtotal: number; tax: number; total: number };
type Item = { id: string; description: string; qty: number; unit_price: number; is_optional: boolean };
type Attachment = { id: string; url: string; kind: string };

export default function PublicEstimatePage() {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const totalWithOptions = useMemo(() => {
    const base = items.filter(i => !i.is_optional).reduce((s, i) => s + i.qty * i.unit_price, 0);
    const opts = items.filter(i => i.is_optional && selectedOptional[i.id]).reduce((s, i) => s + i.qty * i.unit_price, 0);
    return base + opts;
  }, [items, selectedOptional]);

  useEffect(() => { void load(); }, [token]);
  useEffect(() => {
    if (search?.get('print') === '1') {
      setTimeout(() => window.print(), 300);
    }
  }, [search]);
  async function load() {
    setLoading(true);
    try {
      const { data: est } = await supabase.from('estimates').select('id, notes, status, subtotal, tax, total').eq('public_token', token).single();
      if (!est) return;
      setEstimate({ ...est, subtotal: Number(est.subtotal), tax: Number(est.tax), total: Number(est.total) });
      const { data: its } = await supabase.from('estimate_items').select('id, description, qty, unit_price, is_optional').eq('estimate_id', est.id).order('sort_order');
      setItems((its || []).map((i: any) => ({ ...i, qty: Number(i.qty), unit_price: Number(i.unit_price) })) as Item[]);
      const { data: atts } = await supabase.from('estimate_attachments').select('id, url, kind').eq('estimate_id', est.id).order('created_at', { ascending: false });
      setAttachments((atts || []) as Attachment[]);
    } finally { setLoading(false); }
  }

  function toggleOptional(id: string) {
    setSelectedOptional(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function acceptEstimate() {
    if (!estimate) return;
    await supabase.from('estimates').update({ status: 'accepted' }).eq('id', estimate.id);
    alert('Thank you! Your acceptance has been recorded.');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>;
  }
  if (!estimate) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Estimate not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Estimate</h1>
        <p className="text-sm text-gray-600 mb-6">Status: <span className="font-semibold capitalize">{estimate.status}</span></p>

        {attachments.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachments.map((a) => (
                <a key={a.id} href={a.url} target="_blank" className="block rounded border overflow-hidden">
                  <img src={a.url} alt="Attachment" className="w-full h-28 object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-semibold mb-2">Items</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Add</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">{i.description}</td>
                <td className="px-3 py-2 text-right">{i.qty.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">${i.unit_price.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">${(i.qty * i.unit_price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  {i.is_optional ? (
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={!!selectedOptional[i.id]} onChange={() => toggleOptional(i.id)} />
                      <span className="text-xs text-gray-600">Optional</span>
                    </label>
                  ) : (
                    <span className="text-xs text-gray-400">Included</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end gap-8 pt-4 border-t mt-4 text-sm">
          <div>Total: <span className="font-bold">${totalWithOptions.toFixed(2)}</span></div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={acceptEstimate} className="px-4 py-2 bg-emerald-600 text-white rounded">Accept Estimate</button>
        </div>
      </main>
    </div>
  );
}
