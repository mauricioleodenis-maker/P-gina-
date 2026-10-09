import { NextResponse } from 'next/server';
import { buildIcs } from '@/modules/booking/ics';
import { createAdminClient } from '@/lib/supabase/admin';
import { site } from '@/config/site';
import { hashToken, isWellFormedToken } from '@/modules/booking/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Descarga del .ics a partir del token de gestion (no revela datos personales). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!isWellFormedToken(token)) return new NextResponse('No encontrado', { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createAdminClient() as any)
    .from('appointments')
    .select('id,starts_at,ends_at,modality,status')
    .eq('manage_token_hash', hashToken(token))
    .maybeSingle();
  if (!data || data.status === 'cancelled') return new NextResponse('No encontrado', { status: 404 });
  const ics = buildIcs({ uid: data.id, startsAt: new Date(data.starts_at), endsAt: new Date(data.ends_at), summary: `Cita en ${site.name}`, modality: data.modality });
  if (!ics) return new NextResponse('Error', { status: 500 });
  return new NextResponse(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="cita.ics"', 'Cache-Control': 'no-store' },
  });
}
