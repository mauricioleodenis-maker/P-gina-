import { addDays, format } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { TZ } from '@/lib/dates';
import type { Slot } from './types';

export type Rule = { weekday: number; start_time: string; end_time: string; modality: 'in_person' | 'online' | 'both'; active: boolean };
export type Exception = { starts_on: string; ends_on: string; is_closed: boolean; start_time: string | null; end_time: string | null };
export type Busy = { starts_at: string; ends_at: string };

export type AvailabilityInput = {
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
 * Huecos = reglas semanales - excepciones (dias cerrados) + dias extra - citas con buffer,
 * respetando antelacion minima/maxima. Todo en Europe/Madrid. Funcion pura.
 */
export function computeAvailability(i: AvailabilityInput): Slot[] {
  const now = i.now ?? new Date();
  const earliest = now.getTime() + i.minNoticeHours * 3_600_000;
  const latest = now.getTime() + i.maxAdvanceDays * 86_400_000;
  const busy = i.busy.map((b) => ({
    s: new Date(b.starts_at).getTime() - i.bufferMin * 60_000,
    e: new Date(b.ends_at).getTime() + i.bufferMin * 60_000,
  }));
  const out = new Map<string, Slot>();
  let cursor = new Date(`${formatInTimeZone(i.from, TZ, 'yyyy-MM-dd')}T12:00:00Z`);
  const end = new Date(`${formatInTimeZone(i.to, TZ, 'yyyy-MM-dd')}T12:00:00Z`);

  for (; cursor <= end; cursor = addDays(cursor, 1)) {
    const day = format(cursor, 'yyyy-MM-dd');
    const weekday = cursor.getUTCDay();
    const excs = i.exceptions.filter((x) => x.starts_on <= day && x.ends_on >= day);
    if (excs.some((x) => x.is_closed && !(x.start_time && x.end_time))) continue;
    const windows: Array<[string, string]> = i.rules
      .filter((r) => r.active && r.weekday === weekday && (r.modality === 'both' || !i.modality || r.modality === i.modality))
      .map((r) => [hhmm(r.start_time), hhmm(r.end_time)]);
    for (const x of excs) if (!x.is_closed && x.start_time && x.end_time) windows.push([hhmm(x.start_time), hhmm(x.end_time)]);
    const closedParts = excs.filter((x) => x.is_closed && x.start_time && x.end_time);

    for (const [ws, we] of windows) {
      const winStart = fromZonedTime(`${day}T${ws}:00`, TZ).getTime();
      const winEnd = fromZonedTime(`${day}T${we}:00`, TZ).getTime();
      for (let s = winStart; s + i.durationMin * 60_000 <= winEnd; s += i.stepMin * 60_000) {
        const e = s + i.durationMin * 60_000;
        if (s < earliest || s > latest || s < i.from.getTime() || s >= i.to.getTime()) continue;
        if (busy.some((b) => s < b.e && e > b.s)) continue;
        if (closedParts.some((x) => {
          const cs = fromZonedTime(`${day}T${hhmm(x.start_time!)}:00`, TZ).getTime();
          const ce = fromZonedTime(`${day}T${hhmm(x.end_time!)}:00`, TZ).getTime();
          return s < ce && e > cs;
        })) continue;
        const key = new Date(s).toISOString();
        if (!out.has(key)) out.set(key, { start: key, end: new Date(e).toISOString() });
      }
    }
  }
  return [...out.values()].sort((a, b) => a.start.localeCompare(b.start));
}
