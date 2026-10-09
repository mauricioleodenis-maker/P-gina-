import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { TZ } from '@/lib/dates';

export type View = 'day' | 'week' | 'month' | 'agenda';
export const VIEWS: Array<{ id: View; label: string }> = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'agenda', label: 'Agenda' },
];

export const isView = (v: unknown): v is View => v === 'day' || v === 'week' || v === 'month' || v === 'agenda';
export const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Dia de hoy en Madrid (yyyy-MM-dd). */
export const todayMadrid = (now = new Date()) => formatInTimeZone(now, TZ, 'yyyy-MM-dd');

/** Aritmetica de dias sobre cadenas yyyy-MM-dd (sin zona: evita errores de DST). */
export const shiftDay = (day: string, n: number) => addDays(new Date(`${day}T12:00:00Z`), n).toISOString().slice(0, 10);
export const mondayOf = (day: string) => {
  const dow = new Date(`${day}T12:00:00Z`).getUTCDay(); // 0=domingo
  return shiftDay(day, -((dow + 6) % 7));
};
export const startOfMadridDay = (day: string) => fromZonedTime(`${day}T00:00:00`, TZ);

/** Dias que pinta la vista (columnas en semana/dia, 6x7 en mes). */
export function visibleDays(view: View, day: string): string[] {
  if (view === 'day') return [day];
  if (view === 'week') return Array.from({ length: 7 }, (_, i) => shiftDay(mondayOf(day), i));
  if (view === 'month') {
    const first = `${day.slice(0, 7)}-01`;
    const start = mondayOf(first);
    const lastOfMonth = shiftDay(stepDay('month', first, 1), -1);
    const end = shiftDay(mondayOf(lastOfMonth), 6);
    const n = Math.round((new Date(`${end}T12:00:00Z`).getTime() - new Date(`${start}T12:00:00Z`).getTime()) / 86_400_000) + 1;
    return Array.from({ length: n }, (_, i) => shiftDay(start, i));
  }
  return Array.from({ length: 30 }, (_, i) => shiftDay(day, i)); // agenda: 30 dias
}

/** Rango UTC [from, to) de la vista. */
export function getRange(view: View, day: string): { from: Date; to: Date } {
  const days = visibleDays(view, day);
  return { from: startOfMadridDay(days[0]!), to: startOfMadridDay(shiftDay(days[days.length - 1]!, 1)) };
}

export function stepDay(view: View, day: string, dir: -1 | 1): string {
  if (view === 'day') return shiftDay(day, dir);
  if (view === 'week') return shiftDay(day, 7 * dir);
  if (view === 'agenda') return shiftDay(day, 30 * dir);
  const [y, m] = day.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + dir, 1));
  return d.toISOString().slice(0, 10);
}

export function titleFor(view: View, day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const f = (p: string) => formatInTimeZone(d, 'UTC', p, { locale: es });
  if (view === 'day') return f("EEEE d 'de' MMMM yyyy");
  if (view === 'month') return f('MMMM yyyy');
  const days = visibleDays(view, day);
  const a = new Date(`${days[0]}T12:00:00Z`);
  const b = new Date(`${days[days.length - 1]}T12:00:00Z`);
  return `${formatInTimeZone(a, 'UTC', 'd MMM', { locale: es })} – ${formatInTimeZone(b, 'UTC', 'd MMM yyyy', { locale: es })}`;
}

/** Minutos desde las 00:00 de Madrid. */
export const minutesOfDay = (iso: string) => {
  const [h, m] = formatInTimeZone(new Date(iso), TZ, 'HH:mm').split(':').map(Number) as [number, number];
  return h * 60 + m;
};
export const dayOf = (iso: string) => formatInTimeZone(new Date(iso), TZ, 'yyyy-MM-dd');
export const timeLabel = (iso: string) => formatInTimeZone(new Date(iso), TZ, 'HH:mm');
/** Madrid local (dia + minutos) -> ISO UTC. */
export function toIso(day: string, minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return fromZonedTime(`${day}T${h}:${m}:00`, TZ).toISOString();
}
