'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Navigation from '@/components/Navigation';

type Estimate = { id: string; job_id: string; notes: string | null; status: string; subtotal: number; tax: number; total: number; public_token: string; po_number: string | null };
type Item = { id: string; description: string; qty: number; unit_price: number; is_optional: boolean };
type Attachment = { id: string; url: string; kind: string };

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const publicUrl = useMemo(() => estimate ? `${location.origin}/estimates/public/${estimate.public_token}` : '', [estimate]);

  useEffect(() => { void load(); }, [id]);
  async function load() {
    setLoading(true);
    try {
      const { data: est } = await supabase.from('estimates').select('id, job_id, notes, status, subtotal, tax, total, public_token, po_number').eq('id', id).single();
      if (est) setEstimate({ ...est, subtotal: Number(est.subtotal), tax: Number(est.tax), total: Number(est.total), po_number: est.po_number || null });
      const { data: its } = await supabase.from('estimate_items').select('id, description, qty, unit_price, is_optional').eq('estimate_id', id).order('sort_order');
      setItems((its || []).map((i: any) => ({ ...i, qty: Number(i.qty), unit_price: Number(i.unit_price) })) as Item[]);
      const { data: atts } = await supabase.from('estimate_attachments').select('id, url, kind').eq('estimate_id', id).order('created_at', { ascending: false });
      setAttachments((atts || []) as Attachment[]);
    } finally { setLoading(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="sitesense" />
        <div className="flex items-center justify-center py-24"><p className="text-gray-600">Loading estimate…</p></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation variant="sitesense" />
        <div className="flex items-center justify-center py-24"><p className="text-red-600">Estimate not found</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation variant="sitesense" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estimate</h1>
            <p className="text-sm text-gray-600">Status: <span className="font-semibold capitalize">{estimate.status}</span></p>
            {estimate.po_number && (
              <p className="text-sm text-gray-600">PO Number: <span className="font-semibold">{estimate.po_number}</span></p>
            )}
          </div>
          <div className="text-right space-y-2">
            <button onClick={() => { navigator.clipboard.writeText(publicUrl); alert('Public link copied'); }} className="px-3 py-2 bg-blue-600 text-white rounded">Copy Public Link</button>
            <div>
              <button onClick={() => setSendOpen(true)} className="mt-2 px-3 py-2 bg-emerald-600 text-white rounded">Send Estimate</button>
            </div>
            <div>
              <a href={`/api/estimates/${estimate.id}/pdf`} target="_blank" className="inline-block mt-2 px-3 py-2 bg-gray-700 text-white rounded">Download PDF</a>
            </div>
            <div><Link href={`/jobs/${estimate.job_id}`} className="text-blue-600 hover:text-blue-700 text-sm">← Back to Job</Link></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Line Items</h2>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Optional</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2">{i.description}</td>
                    <td className="px-3 py-2 text-right">{i.qty.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${i.unit_price.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${(i.qty * i.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{i.is_optional ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {attachments.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Attachments</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attachments.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" className="block bg-gray-50 rounded border overflow-hidden">
                    <img src={a.url} alt="Attachment" className="w-full h-32 object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-8 pt-4 border-t text-sm">
            <div>Subtotal: <span className="font-semibold">${estimate.subtotal.toFixed(2)}</span></div>
            <div>Tax: <span className="font-semibold">${estimate.tax.toFixed(2)}</span></div>
            <div>Total: <span className="font-bold text-gray-900">${estimate.total.toFixed(2)}</span></div>
          </div>
        </div>
      </main>

      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-1">Send Estimate</h3>
            <p className="text-sm text-gray-600 mb-4">Email a link to the public estimate page.</p>
            <div className="space-y-3">
              <label className="block">
                <span className="block text-sm text-gray-700 mb-1">To email</span>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full border rounded px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="block text-sm text-gray-700 mb-1">Message (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Hi! Please review and accept this estimate."
                  className="w-full border rounded px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={sending} onClick={() => setSendOpen(false)} className="px-3 py-2 rounded border">Cancel</button>
              <button
                disabled={sending || !toEmail}
                onClick={async () => {
                  if (!estimate) return;
                  try {
                    setSending(true);
                    const res = await fetch('/api/estimates/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estimate_id: estimate.id, to_email: toEmail, message })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send');
                    alert('Estimate sent!');
                    setSendOpen(false);
                    setToEmail('');
                    setMessage('');
                  } catch (err: any) {
                    alert(err.message || 'Failed to send');
                  } finally {
                    setSending(false);
                  }
                }}
                className={`px-3 py-2 rounded text-white ${sending || !toEmail ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >{sending ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
