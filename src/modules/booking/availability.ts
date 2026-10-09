import { addDays, format } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { TZ } from '@/lib/dates';
import type { PublicSlot } from './types';

export type Rule = { weekday: number; start_time: string; end_time: string; modality: 'in_person' | 'online' | 'both'; active: boolean };
export type Exception = { starts_on: string; ends_on: string; is_closed: boolean; start_time: string | null; end_time: string | null };
export type Busy = { starts_at: string; ends_at: string };

export type ComputeInput = {
  from: Date;
  to: Date;
  durationMin: number;
  modality?: 'in_person' | 'online';
  rules: Rule[];
  exceptions: Exception[];
  busy: Busy[];
  stepMin: number;
  bufferMin: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  now?: Date;
};

const hhmm = (t: string) => t.slice(0, 5);

/**
 * Huecos libres = reglas semanales - excepciones - citas (con buffer), en Europe/Madrid.
 * Respaldo de `getAvailability` (P7) mientras no este implementado. Funcion pura.
 */
export function computeSlots(i: ComputeInput): PublicSlot[] {
  const now = i.now ?? new Date();
  const earliest = new Date(now.getTime() + i.minNoticeHours * 3_600_000);
  const latest = new Date(now.getTime() + i.maxAdvanceDays * 86_400_000);
  const out: PublicSlot[] = [];
  const busy = i.busy.map((b) => ({
    s: new Date(b.starts_at).getTime() - i.bufferMin * 60_000,
    e: new Date(b.ends_at).getTime() + i.bufferMin * 60_000,
  }));

  // Recorre los dias de Madrid desde el dia de `from` hasta el de `to`.
  const firstDay = formatInTimeZone(i.from, TZ, 'yyyy-MM-dd');
  const lastDay = formatInTimeZone(i.to, TZ, 'yyyy-MM-dd');
  let cursor = new Date(`${firstDay}T12:00:00Z`);
  const end = new Date(`${lastDay}T12:00:00Z`);

  for (; cursor <= end; cursor = addDays(cursor, 1)) {
    const day = format(cursor, 'yyyy-MM-dd');
    const weekday = cursor.getUTCDay();
    const excs = i.exceptions.filter((x) => x.starts_on <= day && x.ends_on >= day);
    if (excs.some((x) => x.is_closed)) continue;

    const windows: Array<[string, string]> = i.rules
      .filter((r) => r.active && r.weekday === weekday && (r.modality === 'both' || !i.modality || r.modality === i.modality))
      .map((r) => [hhmm(r.start_time), hhmm(r.end_time)]);
    for (const x of excs) if (x.start_time && x.end_time) windows.push([hhmm(x.start_time), hhmm(x.end_time)]);

    for (const [ws, we] of windows) {
      const winStart = fromZonedTime(`${day}T${ws}:00`, TZ).getTime();
      const winEnd = fromZonedTime(`${day}T${we}:00`, TZ).getTime();
      for (let t = winStart; t + i.durationMin * 60_000 <= winEnd; t += i.stepMin * 60_000) {
        const s = t;
        const e = t + i.durationMin * 60_000;
        if (s < earliest.getTime() || s > latest.getTime()) continue;
        if (s < i.from.getTime() || s >= i.to.getTime()) continue;
        if (busy.some((b) => s < b.e && e > b.s)) continue;
        out.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() });
      }
    }
  }
  // Sin duplicados (ventanas solapadas) y ordenado.
  const seen = new Set<string>();
  return out
    .filter((s) => (seen.has(s.start) ? false : (seen.add(s.start), true)))
    .sort((a, b) => a.start.localeCompare(b.start));
}
