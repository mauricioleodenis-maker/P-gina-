import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { requireAdmin } from '@/modules/auth/api';
import { db } from '@/modules/billing/db';
import { renderInvoicePdf } from '@/modules/billing/pdf/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** PDF de una factura. Solo admin aal2 (requireAdmin) + RLS. Nunca cacheable. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return new NextResponse('Not found', { status: 404 });
  const supabase = await db();
  const { data } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inv = data as any;
  if (!inv) return new NextResponse('Not found', { status: 404 });

  let body: Buffer | null = null;
  if (inv.pdf_path) {
    const dl = await supabase.storage.from('invoices').download(inv.pdf_path);
    if (dl.data) body = Buffer.from(await dl.data.arrayBuffer());
  }
  if (!body) {
    body = await renderInvoicePdf(inv);
    const path = `${inv.year}/${inv.number}.pdf`;
    const up = await supabase.storage.from('invoices').upload(path, body, { contentType: 'application/pdf', upsert: true });
    if (!up.error) await supabase.from('invoices').update({ pdf_path: path }).eq('id', id);
  }
  await logAudit({ action: 'invoice.pdf_read', table: 'invoices', rowId: id });
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.number}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
