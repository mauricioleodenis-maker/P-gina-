import { NextResponse } from 'next/server';
import { requireAdmin } from '@/modules/auth/api';
import { buildPatientExport, renderPatientPdf } from '@/modules/patients/export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /admin/pacientes/[id]/export?format=json|pdf. Audita la exportacion. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('No encontrado', { status: 404 });
  const data = await buildPatientExport(id);
  if (!data) return new NextResponse('No encontrado', { status: 404 });

  const format = new URL(req.url).searchParams.get('format') === 'pdf' ? 'pdf' : 'json';
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (format === 'pdf') {
    const buf = await renderPatientPdf(data);
    return new NextResponse(new Uint8Array(buf), {
      headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="paciente-${id.slice(0, 8)}.pdf"` },
    });
  }
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="paciente-${id.slice(0, 8)}.json"` },
  });
}
