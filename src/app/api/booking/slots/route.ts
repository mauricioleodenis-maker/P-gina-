import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { slotsQuerySchema } from '@/modules/booking/schema';
import { getPublicSlots } from '@/modules/booking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Disponibilidad calculada en servidor (FR-001). Rango maximo 92 dias. */
export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await rateLimit(ip, { limit: 60, windowSeconds: 60, prefix: 'slots' }))) {
    return NextResponse.json({ ok: false, message: 'Demasiadas consultas. Espera un momento.' }, { status: 429 });
  }
  const sp = new URL(req.url).searchParams;
  const parsed = slotsQuerySchema.safeParse({
    service: sp.get('service'),
    from: sp.get('from'),
    to: sp.get('to'),
    modality: sp.get('modality') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ ok: false, message: 'Parámetros no válidos.' }, { status: 400 });
  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (!(to > from) || to.getTime() - from.getTime() > 92 * 86_400_000) {
    return NextResponse.json({ ok: false, message: 'Rango no válido.' }, { status: 400 });
  }
  try {
    const slots = await getPublicSlots(from, to, parsed.data.service, parsed.data.modality);
    return NextResponse.json({ ok: true, slots }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, message: 'No se ha podido cargar la disponibilidad.' }, { status: 500 });
  }
}
