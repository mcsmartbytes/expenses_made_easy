import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/utils/supabaseAdmin';
import { estimateToPdfBytes } from '@/lib/estimatePdf';

type EstimateRecord = {
  id: string;
  user_id: string | null;
  created_at: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  po_number: string | null;
  jobs: { name: string } | { name: string }[] | null;
};

type EstimateItemRecord = {
  description: string;
  qty: number | string;
  unit_price: number | string;
  is_optional: boolean;
};

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { data: estRaw, error: estErr } = await supabaseAdmin
      .from('estimates')
      .select('id, user_id, created_at, subtotal, tax, total, po_number, jobs(name)')
      .eq('id', id)
      .single();
    const est = estRaw as EstimateRecord | null;
    if (estErr || !est) {
      return new Response(JSON.stringify({ error: 'Estimate not found' }), { status: 404 });
    }

    const { data: itemsRaw } = await supabaseAdmin
      .from('estimate_items')
      .select('description, qty, unit_price, is_optional')
      .eq('estimate_id', id)
      .order('sort_order');
    const items = (itemsRaw || []) as EstimateItemRecord[];

    // Load branding from user profile
    let branding: { businessName?: string; companyEmail?: string; companyPhone?: string; companyAddress?: string; companyWebsite?: string } | undefined;
    if (est.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('business_name, preferences')
        .eq('user_id', est.user_id)
        .single();
      const b = (profile?.preferences as any)?.branding || {};
      branding = {
        businessName: profile?.business_name || undefined,
        companyEmail: b.company_email || undefined,
        companyPhone: b.company_phone || undefined,
        companyAddress: b.company_address || undefined,
        companyWebsite: b.company_website || undefined,
      };
    }

    const jobName = Array.isArray(est.jobs) ? est.jobs[0]?.name : est.jobs?.name;

    const pdf = estimateToPdfBytes(
      {
        id: est.id,
        created_at: est.created_at,
        subtotal: Number(est.subtotal),
        tax: Number(est.tax),
        total: Number(est.total),
      },
      items.map((i) => ({
        description: i.description,
        qty: Number(i.qty),
        unit_price: Number(i.unit_price),
        is_optional: i.is_optional,
      })),
      jobName || undefined,
      est.po_number || undefined,
      branding
    ) as Uint8Array<ArrayBuffer>;

    const pdfBlob = new Blob([pdf], { type: 'application/pdf' });

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="estimate-${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Failed to generate PDF' }), { status: 500 });
  }
}
