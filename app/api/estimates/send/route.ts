import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { estimateToPdfBytes } from '@/lib/estimatePdf';

type EstimateRecord = {
  id: string;
  user_id: string | null;
  job_id: string | null;
  notes?: string | null;
  status?: string | null;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  public_token: string;
  po_number: string | null;
  jobs: { name: string } | { name: string }[] | null;
};

type EstimateItemRecord = {
  description: string;
  qty: number | string;
  unit_price: number | string;
  is_optional: boolean;
};

type EstimateAttachmentRecord = {
  url: string;
  kind: string | null;
};

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'estimates@localhost';
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html })
  });
  if (!res.ok) throw new Error(`Resend error: ${res.status}`);
}

async function sendViaSendgrid(to: string, subject: string, html: string, pdfBase64?: string, pdfName?: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.FROM_EMAIL || 'estimates@localhost';
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }],
      attachments: pdfBase64 && pdfName ? [
        { content: pdfBase64, filename: pdfName, type: 'application/pdf', disposition: 'attachment' }
      ] : undefined
    })
  });
  if (!res.ok) throw new Error(`SendGrid error: ${res.status}`);
}

export async function POST(req: NextRequest) {
  try {
    const { estimate_id, to_email, message } = await req.json();
    if (!estimate_id || !to_email) {
      return NextResponse.json({ success: false, error: 'Missing estimate_id or to_email' }, { status: 400 });
    }

    const { data: estRaw } = await supabaseAdmin
      .from('estimates')
      .select('id, user_id, job_id, notes, status, subtotal, tax, total, public_token, po_number, jobs(name)')
      .eq('id', estimate_id)
      .single();
    const est = estRaw as EstimateRecord | null;

    if (!est) return NextResponse.json({ success: false, error: 'Estimate not found' }, { status: 404 });

    const { data: itemsRaw } = await supabaseAdmin
      .from('estimate_items')
      .select('description, qty, unit_price, is_optional')
      .eq('estimate_id', estimate_id)
      .order('sort_order');
    const items = (itemsRaw || []) as EstimateItemRecord[];

    const { data: attsRaw } = await supabaseAdmin
      .from('estimate_attachments')
      .select('url, kind')
      .eq('estimate_id', estimate_id)
      .order('created_at', { ascending: false });
    const atts = (attsRaw || []) as EstimateAttachmentRecord[];

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const publicUrl = `${origin}/estimates/public/${est.public_token}`;

    const itemsHtml = items
      .map((i) => `<tr><td>${i.description}</td><td style="text-align:right">${Number(i.qty).toFixed(2)}</td><td style="text-align:right">$${Number(i.unit_price).toFixed(2)}</td><td style="text-align:right">$${(Number(i.qty) * Number(i.unit_price)).toFixed(2)}</td><td style="text-align:right">${i.is_optional ? 'Optional' : ''}</td></tr>`) 
      .join('');
    const attsHtml = atts
      .map((a) => `<a href="${a.url}"><img src="${a.url}" alt="Attachment" style="max-width:140px;margin:4px;border-radius:6px;border:1px solid #eee"/></a>`) 
      .join('');

    // Load branding
    let branding: any = {};
    if (est.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('business_name, preferences')
        .eq('user_id', est.user_id)
        .single();
      const b = (profile?.preferences as any)?.branding || {};
      branding = {
        business_name: profile?.business_name || undefined,
        logo_url: b.logo_url || undefined,
        company_email: b.company_email || undefined,
        company_phone: b.company_phone || undefined,
        company_address: b.company_address || undefined,
        company_website: b.company_website || undefined,
      };
    }

    const jobName = Array.isArray(est.jobs) ? est.jobs[0]?.name : est.jobs?.name;

    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
        ${branding.logo_url ? `<div style=\"margin-bottom:8px\"><img src=\"${branding.logo_url}\" alt=\"Logo\" style=\"max-height:48px\"/></div>` : ''}
        ${branding.business_name ? `<h1 style=\"margin:0 0 6px;font-size:18px\">${branding.business_name}</h1>` : ''}
        ${(branding.company_email || branding.company_phone || branding.company_website) ? `<div style=\"color:#666;margin:0 0 12px;font-size:12px\">${[branding.company_email, branding.company_phone, branding.company_website].filter(Boolean).join(' • ')}</div>` : ''}
        <h2 style="margin:0 0 4px">Estimate for ${jobName || 'Job'}</h2>
        ${est.po_number ? `<p style=\"margin:0 0 8px;color:#555\"><strong>PO Number:</strong> ${est.po_number}</p>` : ''}
        <p style="margin:0 0 12px;color:#555">${message ? String(message) : 'Please review your estimate below.'}</p>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee">
          <thead>
            <tr style="background:#fafafa"><th style="text-align:left;padding:6px">Description</th><th style="text-align:right;padding:6px">Qty</th><th style="text-align:right;padding:6px">Unit</th><th style="text-align:right;padding:6px">Amount</th><th style="text-align:right;padding:6px">&nbsp;</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        ${attsHtml ? `<div style="margin:12px 0"><strong>Photos:</strong><div>${attsHtml}</div></div>` : ''}
        <div style="margin-top:12px;text-align:right">
          <div>Subtotal: <strong>$${Number(est.subtotal).toFixed(2)}</strong></div>
          <div>Tax: <strong>$${Number(est.tax).toFixed(2)}</strong></div>
          <div>Total: <strong>$${Number(est.total).toFixed(2)}</strong></div>
        </div>
        <p style="margin-top:16px">View and accept online: <a href="${publicUrl}">${publicUrl}</a></p>
      </div>
    `;

    // Build PDF attachment (for SendGrid)
    let pdfBase64: string | undefined;
    const pdfName = `estimate-${est.id}.pdf`;
    try {
      const pdfBytes = estimateToPdfBytes(
        { id: est.id, subtotal: Number(est.subtotal), tax: Number(est.tax), total: Number(est.total) },
        items.map((i) => ({ description: i.description, qty: Number(i.qty), unit_price: Number(i.unit_price), is_optional: i.is_optional })),
        jobName,
        est.po_number || undefined,
        {
          businessName: branding.business_name,
          companyEmail: branding.company_email,
          companyPhone: branding.company_phone,
          companyAddress: branding.company_address,
          companyWebsite: branding.company_website,
        }
      );
      pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    } catch {}

    const subject = `Estimate for ${jobName || 'your project'}`;
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendgrid(to_email, subject, html, pdfBase64, pdfName);
    } else {
      await sendViaResend(to_email, subject, html);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to send' }, { status: 500 });
  }
}
