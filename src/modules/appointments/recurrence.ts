import { RRule } from 'rrule';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { addDays } from 'date-fns';
import { TZ } from '@/lib/dates';
import type { Frequency } from './types';

/**
 * Recurrencia (ADR-0009). Se expande en HORA LOCAL de Madrid y cada ocurrencia se convierte a UTC,
 * de modo que "martes 10:00" sigue siendo las 10:00 de Madrid tras el cambio horario (DST).
 * El fin se guarda en `appointment_series.until` (nunca COUNT), para poder partir series.
 */
export function buildRrule(frequency: Frequency): string {
  if (frequency === 'weekly') return 'FREQ=WEEKLY;INTERVAL=1';
  if (frequency === 'biweekly') return 'FREQ=WEEKLY;INTERVAL=2';
  return 'FREQ=MONTHLY;INTERVAL=1';
}

const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm:ss";
/** Hora local de Madrid de un instante, representada como Date "flotante" en UTC. */
const toFloating = (d: Date) => new Date(`${formatInTimeZone(d, TZ, LOCAL_FMT)}Z`);
const fromFloating = (f: Date) => fromZonedTime(f.toISOString().slice(0, 19), TZ);

export type ExpandInput = {
  rrule: string;
  dtstart: Date;
  /** Fecha yyyy-MM-dd (inclusive, hora Madrid) o null. */
  until?: string | null;
  from: Date;
  to: Date;
  /** Seguridad: maximo de ocurrencias. */
  limit?: number;
};

/** Instantes de inicio (UTC) de las ocurrencias con from <= inicio < to. */
export function expandOccurrences({ rrule, dtstart, until, from, to, limit = 400 }: ExpandInput): Date[] {
  const opts = RRule.parseString(rrule);
  opts.dtstart = toFloating(dtstart);
  if (until) opts.until = new Date(`${until}T23:59:59Z`);
  const rule = new RRule(opts);
  const lo = toFloating(from);
  const hi = new Date(toFloating(to).getTime() - 1);
  return rule
    .between(lo, hi, true)
    .slice(0, limit)
    .map(fromFloating);
}

/** Fecha de fin (yyyy-MM-dd) tras `count` ocurrencias. */
export function untilFromCount(rrule: string, dtstart: Date, count: number): string {
  const opts = RRule.parseString(rrule);
  opts.dtstart = toFloating(dtstart);
  opts.count = Math.max(1, count);
  const all = new RRule(opts).all();
  const last = all[all.length - 1] ?? opts.dtstart;
  return last.toISOString().slice(0, 10);
}

/** Aplica una hora local (HH:mm) de Madrid al dia local de `base`. */
export function withLocalTime(base: Date, hhmm: string): Date {
  const day = formatInTimeZone(base, TZ, 'yyyy-MM-dd');
  return fromZonedTime(`${day}T${hhmm}:00`, TZ);
}

export const localHHmm = (d: Date) => formatInTimeZone(d, TZ, 'HH:mm');
export const localDay = (d: Date) => formatInTimeZone(d, TZ, 'yyyy-MM-dd');
export const dayBefore = (day: string) => addDays(new Date(`${day}T12:00:00Z`), -1).toISOString().slice(0, 10);
