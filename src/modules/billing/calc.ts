import { formatMadrid } from '@/lib/dates';
import type { PaymentMethod } from '@/types/database';
import { METHOD_LABEL, type Breakdown, type RevenuePoint, type RevenueReport } from './types';

export type IncomeRow = {
  amount_cents: number;
  status: string;
  paid_at: string | null;
  method: PaymentMethod;
  service_id: string | null;
};

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const monthLabel = (m: number) => MONTHS_ES[m - 1] ?? '';

/** Importe con signo: cobro suma, reembolso resta, resto no cuenta. */
export function signedCents(r: { amount_cents: number; status: string }): number {
  if (r.status === 'paid') return r.amount_cents;
  if (r.status === 'refunded') return -r.amount_cents;
  return 0;
}

/** Interpreta "45", "45,5", "1.234,50" o "45.50" y devuelve centimos enteros (o null). */
export function parseEuros(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) : null;
  let s = input.trim().replace(/\s|€/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) ?? []).length > 1) s = s.replace(/\./g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** Centimos -> "45,50" (sin simbolo; para CSV y campos). */
export function centsToPlain(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/** Serie mensual (12 puntos, meses vacios a cero) para un anio en Europe/Madrid. */
export function monthlySeries(rows: IncomeRow[], year: number): RevenuePoint[] {
  const acc = Array.from({ length: 12 }, (_, i) => ({
    period: `${year}-${String(i + 1).padStart(2, '0')}`,
    incomeCents: 0,
    paymentsCount: 0,
  }));
  for (const r of rows) {
    if (!r.paid_at) continue;
    const ym = formatMadrid(new Date(r.paid_at), 'yyyy-MM');
    const p = acc.find((x) => x.period === ym);
    if (!p) continue;
    p.incomeCents += signedCents(r);
    if (r.status === 'paid') p.paymentsCount += 1;
  }
  return acc;
}

export function breakdown(items: { key: string; cents: number }[], limit = 8): Breakdown[] {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.key, (map.get(i.key) ?? 0) + i.cents);
  return [...map.entries()]
    .map(([label, cents]) => ({ label, cents }))
    .filter((b) => b.cents !== 0)
    .sort((a, b) => b.cents - a.cents)
    .slice(0, limit);
}

export function variationPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function buildReport(
  rows: IncomeRow[],
  year: number,
  serviceNames: Map<string, string>,
  now = new Date(),
): RevenueReport {
  const cur = monthlySeries(rows, year);
  const prev = monthlySeries(rows, year - 1);
  const inYear = rows.filter((r) => r.paid_at && formatMadrid(new Date(r.paid_at), 'yyyy') === String(year));
  const totalCurrent = cur.reduce((s, p) => s + p.incomeCents, 0);
  const totalPrevious = prev.reduce((s, p) => s + p.incomeCents, 0);
  const nowYm = formatMadrid(now, 'yyyy-MM');
  const [ny = 0, nm = 1] = nowYm.split('-').map(Number);
  const pm = nm === 1 ? { y: ny - 1, m: 12 } : { y: ny, m: nm - 1 };
  const find = (y: number, m: number) =>
    (y === year ? cur : y === year - 1 ? prev : monthlySeries(rows, y))[m - 1]?.incomeCents ?? 0;
  return {
    year,
    months: cur.map((p, i) => ({ month: i + 1, label: monthLabel(i + 1), current: p.incomeCents, previous: prev[i]?.incomeCents ?? 0 })),
    totalCurrent,
    totalPrevious,
    variationPct: variationPct(totalCurrent, totalPrevious),
    byMethod: breakdown(inYear.map((r) => ({ key: METHOD_LABEL[r.method] ?? r.method, cents: signedCents(r) }))),
    byService: breakdown(
      inYear.map((r) => ({ key: (r.service_id && serviceNames.get(r.service_id)) || 'Sin servicio', cents: signedCents(r) })),
    ),
    currentMonthCents: find(ny, nm),
    previousMonthCents: find(pm.y, pm.m),
  };
}

/** Base imponible a partir de un total cobrado con IVA incluido (rate en %). */
export function baseFromTotal(totalCents: number, vatRate: number): number {
  return Math.round(totalCents / (1 + vatRate / 100));
}

/** Calculo identico al de issue_invoice (round(subtotal*rate/100)). */
export function invoiceTotals(subtotalCents: number, vatRate: number) {
  const vat = Math.round((subtotalCents * vatRate) / 100);
  return { subtotalCents, vatCents: vat, totalCents: subtotalCents + vat };
}

/** Formato de numero de factura (refleja issue_invoice): F-2026-0001. */
export function formatInvoiceNumber(series: string, year: number, seq: number): string {
  return `${series}-${year}-${String(seq).padStart(4, '0')}`;
}

/** Dias enteros entre una fecha ISO y ahora. */
export function ageInDays(iso: string | null, now = new Date()): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}
