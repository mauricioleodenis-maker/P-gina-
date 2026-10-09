import 'server-only';
import { requireAdmin } from '@/modules/auth/api';
import { formatMadrid } from '@/lib/dates';
import { db } from './db';
import { ageInDays, buildReport, monthlySeries, signedCents, type IncomeRow } from './calc';
import type {
  BillablePayment, InvoiceListItem, PaymentListItem, PendingCharge, RevenuePoint, RevenueReport,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const madridStart = (ymd: string) => new Date(`${ymd}T00:00:00+01:00`); // aproximacion segura para filtros anchos

/** Contrato fijo (PLAN s.9): serie de ingresos netos (cobros - reembolsos). */
export async function getRevenueSeries(
  range: { from: Date; to: Date },
  granularity: 'day' | 'month',
): Promise<RevenuePoint[]> {
  await requireAdmin();
  const supabase = await db();
  const { data, error } = await supabase
    .from('payments')
    .select('amount_cents,status,paid_at')
    .in('status', ['paid', 'refunded'])
    .gte('paid_at', range.from.toISOString())
    .lt('paid_at', range.to.toISOString());
  if (error) throw new Error('No se pudieron leer los ingresos');
  const fmt = granularity === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM';
  const map = new Map<string, RevenuePoint>();
  for (const r of (data ?? []) as any[]) {
    const key = formatMadrid(new Date(r.paid_at), fmt);
    const p = map.get(key) ?? { period: key, incomeCents: 0, paymentsCount: 0 };
    p.incomeCents += signedCents(r);
    if (r.status === 'paid') p.paymentsCount += 1;
    map.set(key, p);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

/** Informe anual (12 meses vs anio anterior, por metodo y por servicio). */
export async function getRevenueReport(year: number): Promise<RevenueReport> {
  await requireAdmin();
  const supabase = await db();
  const [{ data: pays, error }, { data: services }] = await Promise.all([
    supabase
      .from('payments')
      .select('amount_cents,status,paid_at,method,service_id')
      .in('status', ['paid', 'refunded'])
      .gte('paid_at', `${year - 2}-12-31T00:00:00Z`)
      .lt('paid_at', `${year + 1}-01-02T00:00:00Z`),
    supabase.from('services').select('id,name'),
  ]);
  if (error) throw new Error('No se pudieron leer los ingresos');
  const names = new Map<string, string>(((services ?? []) as any[]).map((s) => [s.id, s.name]));
  return buildReport((pays ?? []) as IncomeRow[], year, names);
}

export async function getYearOptions(): Promise<number[]> {
  await requireAdmin();
  const supabase = await db();
  const { data } = await supabase
    .from('payments')
    .select('paid_at')
    .not('paid_at', 'is', null)
    .order('paid_at', { ascending: true })
    .limit(1);
  const first = (data as any[] | null)?.[0]?.paid_at ? Number(formatMadrid(new Date((data as any[])[0].paid_at), 'yyyy')) : null;
  const now = Number(formatMadrid(new Date(), 'yyyy'));
  const from = Math.min(first ?? now, now);
  return Array.from({ length: now - from + 1 }, (_, i) => now - i);
}

/** Cobros mas recientes (filtro opcional por mes yyyy-MM). */
export async function listPayments(opts: { month?: string; limit?: number } = {}): Promise<PaymentListItem[]> {
  await requireAdmin();
  const supabase = await db();
  let q = supabase
    .from('payments')
    .select('*, patients(full_name), services(name), invoices(number)')
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.month) {
    const [y = 0, m = 1] = opts.month.split('-').map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
    q = q.gte('paid_at', madridStart(`${opts.month}-01`).toISOString()).lt('paid_at', madridStart(`${next}-01`).toISOString());
  }
  const { data, error } = await q;
  if (error) throw new Error('No se pudieron leer los pagos');
  const rows = (data ?? []) as any[];
  const refunded = new Map<string, number>();
  for (const r of rows) if (r.status === 'refunded' && r.refund_of) refunded.set(r.refund_of, (refunded.get(r.refund_of) ?? 0) + r.amount_cents);
  return rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patients?.full_name ?? 'Paciente',
    appointmentId: r.appointment_id,
    invoiceId: r.invoice_id,
    invoiceNumber: r.invoices?.number ?? null,
    serviceName: r.services?.name ?? null,
    refundOf: r.refund_of,
    amountCents: r.amount_cents,
    refundedCents: refunded.get(r.id) ?? 0,
    method: r.method,
    status: r.status,
    paidAt: r.paid_at,
    concept: r.concept,
    createdAt: r.created_at,
  }));
}

/**
 * Contrato fijo. Citas realizadas con saldo pendiente (precio - cobrado neto) y cobros
 * 'pending' sueltos, con antiguedad.
 */
export async function getPendingCharges(): Promise<PendingCharge[]> {
  await requireAdmin();
  const supabase = await db();
  const [{ data: appts, error }, { data: pendingRows }] = await Promise.all([
    supabase
      .from('appointments')
      .select('id,patient_id,starts_at,price_cents,services(name,price_cents),patients(full_name)')
      .eq('status', 'completed')
      .not('patient_id', 'is', null)
      .order('starts_at', { ascending: false })
      .limit(500),
    supabase.from('payments').select('*, patients(full_name), services(name)').eq('status', 'pending'),
  ]);
  if (error) throw new Error('No se pudieron leer las citas');
  const apptList = (appts ?? []) as any[];
  const ids = apptList.map((a) => a.id);
  const { data: pays } = ids.length
    ? await supabase.from('payments').select('appointment_id,amount_cents,status').in('appointment_id', ids)
    : { data: [] as any[] };
  const paid = new Map<string, number>();
  for (const p of (pays ?? []) as any[]) paid.set(p.appointment_id, (paid.get(p.appointment_id) ?? 0) + signedCents(p));
  const pendingByAppt = new Map<string, any>();
  for (const p of (pendingRows ?? []) as any[]) if (p.appointment_id) pendingByAppt.set(p.appointment_id, p);

  const out: PendingCharge[] = [];
  for (const a of apptList) {
    const price = a.price_cents ?? a.services?.price_cents ?? 0;
    const paidCents = paid.get(a.id) ?? 0;
    const balance = price - paidCents;
    if (price <= 0 || balance <= 0) continue;
    out.push({
      key: `a-${a.id}`,
      appointmentId: a.id,
      pendingPaymentId: pendingByAppt.get(a.id)?.id ?? null,
      patientId: a.patient_id,
      patientName: a.patients?.full_name ?? 'Paciente',
      serviceName: a.services?.name ?? null,
      startsAt: a.starts_at,
      priceCents: price,
      paidCents,
      balanceCents: balance,
      ageDays: ageInDays(a.starts_at),
    });
  }
  for (const p of (pendingRows ?? []) as any[]) {
    if (p.appointment_id && out.some((o) => o.appointmentId === p.appointment_id)) continue;
    out.push({
      key: `p-${p.id}`,
      appointmentId: p.appointment_id,
      pendingPaymentId: p.id,
      patientId: p.patient_id,
      patientName: p.patients?.full_name ?? 'Paciente',
      serviceName: p.services?.name ?? p.concept ?? null,
      startsAt: null,
      priceCents: p.amount_cents,
      paidCents: 0,
      balanceCents: p.amount_cents,
      ageDays: ageInDays(p.created_at),
    });
  }
  return out.sort((a, b) => b.ageDays - a.ageDays);
}

/**
 * Contrato fijo. Crea (o reutiliza) el cobro pendiente de una cita por su saldo.
 * Lo llama P7 al marcar la cita como realizada. Idempotente.
 */
export async function createChargeForAppointment(appointmentId: string): Promise<{ id: string }> {
  await requireAdmin();
  const supabase = await db();
  const { data: a, error } = await supabase
    .from('appointments')
    .select('id,patient_id,service_id,price_cents,services(name,price_cents)')
    .eq('id', appointmentId)
    .single();
  if (error || !a) throw new Error('Cita no encontrada');
  const appt = a as any;
  if (!appt.patient_id) throw new Error('La cita no tiene paciente asociado');
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending')
    .limit(1);
  if ((existing as any[] | null)?.[0]) return { id: (existing as any[])[0].id };
  const { data: pays } = await supabase.from('payments').select('amount_cents,status').eq('appointment_id', appointmentId);
  const price = appt.price_cents ?? appt.services?.price_cents ?? 0;
  const balance = price - ((pays ?? []) as any[]).reduce((s, p) => s + signedCents(p), 0);
  if (balance <= 0) throw new Error('La cita no tiene saldo pendiente (precio 0 o ya cobrada)');
  const { data: ins, error: e2 } = await supabase
    .from('payments')
    .insert({
      patient_id: appt.patient_id,
      appointment_id: appointmentId,
      service_id: appt.service_id,
      amount_cents: balance,
      status: 'pending',
      method: 'cash',
      concept: appt.services?.name ?? 'Sesion',
    })
    .select('id')
    .single();
  if (e2 || !ins) throw new Error('No se pudo crear el cobro pendiente');
  return { id: (ins as any).id };
}

export async function listInvoices(opts: { month?: string; limit?: number } = {}): Promise<InvoiceListItem[]> {
  await requireAdmin();
  const supabase = await db();
  let q = supabase
    .from('invoices')
    .select('*, patients(full_name)')
    .order('year', { ascending: false })
    .order('seq_no', { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.month) {
    const [y = 0, m = 1] = opts.month.split('-').map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    q = q.gte('issued_on', `${opts.month}-01`).lte('issued_on', `${opts.month}-${String(last).padStart(2, '0')}`);
  }
  const { data, error } = await q;
  if (error) throw new Error('No se pudieron leer las facturas');
  const rows = (data ?? []) as any[];
  const numbers = new Map<string, string>(rows.map((r) => [r.id, r.number]));
  return rows.map((r) => toInvoiceItem(r, numbers));
}

function toInvoiceItem(r: any, numbers: Map<string, string>): InvoiceListItem {
  return {
    id: r.id,
    number: r.number,
    patientId: r.patient_id,
    patientName: r.patients?.full_name ?? 'Paciente',
    issuedOn: r.issued_on,
    subtotalCents: r.subtotal_cents,
    vatCents: r.vat_cents,
    vatRate: Number(r.vat_rate),
    totalCents: r.total_cents,
    status: r.status,
    concept: r.concept,
    rectifiesId: r.rectifies_id,
    rectifiesNumber: r.rectifies_id ? numbers.get(r.rectifies_id) ?? null : null,
    hasPdf: !!r.pdf_path,
  };
}

export async function getInvoice(id: string): Promise<(InvoiceListItem & { snapshot: unknown; payments: BillablePayment[]; patientEmail: string | null; rectifiedBy: string | null }) | null> {
  await requireAdmin();
  const supabase = await db();
  const { data } = await supabase.from('invoices').select('*, patients(full_name,email)').eq('id', id).maybeSingle();
  if (!data) return null;
  const r = data as any;
  const [{ data: orig }, { data: pays }, { data: rect }] = await Promise.all([
    r.rectifies_id ? supabase.from('invoices').select('id,number').eq('id', r.rectifies_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('payments').select('id,amount_cents,concept,paid_at,method').eq('invoice_id', id),
    supabase.from('invoices').select('number').eq('rectifies_id', id).limit(1),
  ]);
  const numbers = new Map<string, string>();
  if (orig) numbers.set((orig as any).id, (orig as any).number);
  return {
    ...toInvoiceItem(r, numbers),
    snapshot: r.fiscal_snapshot,
    patientEmail: r.patients?.email ?? null,
    rectifiedBy: (rect as any[] | null)?.[0]?.number ?? null,
    payments: ((pays ?? []) as any[]).map((p) => ({ id: p.id, amountCents: p.amount_cents, concept: p.concept, paidAt: p.paid_at, method: p.method })),
  };
}

/** Cobros 'paid' del paciente sin factura (candidatos a facturar). */
export async function listBillablePayments(patientId?: string): Promise<(BillablePayment & { patientId: string; patientName: string })[]> {
  await requireAdmin();
  const supabase = await db();
  let q = supabase
    .from('payments')
    .select('id,patient_id,amount_cents,concept,paid_at,method,patients(full_name)')
    .eq('status', 'paid')
    .is('invoice_id', null)
    .order('paid_at', { ascending: false })
    .limit(300);
  if (patientId) q = q.eq('patient_id', patientId);
  const { data } = await q;
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id, patientId: p.patient_id, patientName: p.patients?.full_name ?? 'Paciente',
    amountCents: p.amount_cents, concept: p.concept, paidAt: p.paid_at, method: p.method,
  }));
}

export { monthlySeries };
