import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { materializeSeries } from '@/modules/appointments/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron diario (03:00 UTC, vercel.json de P10): extiende las series activas hasta
 * `practice_settings.recurrence_weeks`. Exige `Authorization: Bearer $CRON_SECRET`.
 * Un solape en una fecha concreta solo cuenta como conflicto; no detiene el resto.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminClient() as any;
  const [{ data: st }, { data: list, error }] = await Promise.all([
    sb.from('practice_settings').select('recurrence_weeks').maybeSingle(),
    sb.from('appointment_series').select('*').eq('active', true),
  ]);
  if (error) {
    console.error('materialize query failed', error.code);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  const today = new Date().toISOString().slice(0, 10);
  let created = 0;
  let conflicts = 0;
  let failed = 0;
  for (const s of list ?? []) {
    if (s.until && s.until < today) continue;
    try {
      const r = await materializeSeries(sb, s, st?.recurrence_weeks ?? 12);
      created += r.created;
      conflicts += r.conflicts.length;
    } catch {
      failed++;
    }
  }
  return NextResponse.json({ ok: true, series: list?.length ?? 0, created, conflicts, failed });
}
