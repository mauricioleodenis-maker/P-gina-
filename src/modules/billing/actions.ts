'use server';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { EMAIL_FROM, getResend } from '@/lib/email/client';
import { formatCents } from '@/lib/money';
import { requireAdmin } from '@/modules/auth/api';
import type { ActionResult } from '@/modules/auth/types';
import { getPracticeSettings } from '@/modules/settings/api';
import { baseFromTotal } from './calc';
import { db } from './db';
import { renderInvoicePdf } from './pdf/render';
import { issueInvoiceSchema, markPaidSchema, paymentSchema, rectifySchema, refundSchema } from './schemas';
import type { FiscalSnapshot } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ok = <T,>(data?: T): ActionResult<T> => ({ ok: true, data });
const fail = (error: string): ActionResult<never> => ({ ok: false, error });
const firstIssue = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? 'Datos no validos';
const touch = () => {
  revalidatePath('/admin/ingresos');
  revalidatePath('/admin/ingresos/facturas');
  revalidatePath('/admin');
};
/** Mediodia Madrid de una fecha yyyy-MM-dd (evita saltos de dia por zona). */
const paidAtIso = (ymd: string) => new Date(`${ymd}T12:00:00+01:00`).toISOString();

/** Registra un cobro (parcial o completo). */
export async function recordPaymentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const p = paymentSchema.safeParse(input);
  if (!p.success) return fail(firstIssue(p.error));
  const v = p.data;
  const supabase = await db();
  let serviceId = v.serviceId;
  if (v.appointmentId) {
    const { data: a } = await supabase.from('appointments').select('patient_id,service_id').eq('id', v.appointmentId).maybeSingle();
    if (!a) return fail('La cita no existe');
    if ((a as any).patient_id !== v.patientId) return fail('La cita pertenece a otro paciente');
    serviceId ??= (a as any).service_id;
  }
  const { data, error } = await supabase
    .from('payments')
    .insert({
      patient_id: v.patientId,
      appointment_id: v.appointmentId,
      service_id: serviceId,
      amount_cents: v.amount,
      method: v.method,
      status: 'paid',
      paid_at: paidAtIso(v.paidOn),
      concept: v.concept,
    })
    .select('id')
    .single();
  if (error || !data) return fail('No se pudo registrar el cobro');
  await logAudit({ action: 'payment.create', table: 'payments', rowId: (data as any).id });
  touch();
  return ok({ id: (data as any).id });
}

/** Marca como cobrado un cobro pendiente; si el importe es menor, el resto queda pendiente. */
export async function markPendingPaidAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const p = markPaidSchema.safeParse(input);
  if (!p.success) return fail(firstIssue(p.error));
  const v = p.data;
  const supabase = await db();
  const { data: row } = await supabase.from('payments').select('*').eq('id', v.paymentId).maybeSingle();
  const pay = row as any;
  if (!pay || pay.status !== 'pending') return fail('El cobro ya no esta pendiente');
  if (v.amount > pay.amount_cents) return fail('El importe supera el pendiente');
  if (v.amount === pay.amount_cents) {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid', method: v.method, paid_at: paidAtIso(v.paidOn) })
      .eq('id', v.paymentId)
      .eq('status', 'pending');
    if (error) return fail('No se pudo marcar como cobrado');
  } else {
    const { error } = await supabase.from('payments').insert({
      patient_id: pay.patient_id, appointment_id: pay.appointment_id, service_id: pay.service_id,
      amount_cents: v.amount, method: v.method, status: 'paid', paid_at: paidAtIso(v.paidOn), concept: pay.concept,
    });
    if (error) return fail('No se pudo registrar el cobro parcial');
    const { error: e2 } = await supabase.from('payments').update({ amount_cents: pay.amount_cents - v.amount }).eq('id', v.paymentId);
    if (e2) return fail('Cobro registrado, pero no se pudo actualizar el saldo pendiente');
  }
  await logAudit({ action: 'payment.mark_paid', table: 'payments', rowId: v.paymentId });
  touch();
  return ok({ id: v.paymentId });
}

/** Crea el cobro pendiente de una cita (acceso rapido desde la lista de pendientes). */
export async function createChargeAction(appointmentId: string): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  try {
    const { createChargeForAppointment } = await import('./api');
    const r = await createChargeForAppointment(appointmentId);
    touch();
    return ok(r);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'No se pudo crear el cobro');
  }
}

/** Reembolso = fila nueva status 'refunded' con refund_of (importe positivo, C16). */
export async function refundPaymentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const p = refundSchema.safeParse(input);
  if (!p.success) return fail(firstIssue(p.error));
  const v = p.data;
  const supabase = await db();
  const { data: row } = await supabase.from('payments').select('*').eq('id', v.paymentId).maybeSingle();
  const pay = row as any;
  if (!pay || pay.status !== 'paid') return fail('Solo se pueden reembolsar cobros realizados');
  const { data: prev } = await supabase.from('payments').select('amount_cents').eq('refund_of', v.paymentId).eq('status', 'refunded');
  const already = ((prev ?? []) as any[]).reduce((s, r) => s + r.amount_cents, 0);
  if (v.amount > pay.amount_cents - already) return fail('El reembolso supera lo cobrado pendiente de devolver');
  const { data, error } = await supabase
    .from('payments')
    .insert({
      patient_id: pay.patient_id, appointment_id: pay.appointment_id, service_id: pay.service_id,
      refund_of: pay.id, amount_cents: v.amount, method: pay.method, status: 'refunded',
      paid_at: new Date().toISOString(), concept: v.reason ? `Reembolso: ${v.reason}` : 'Reembolso',
    })
    .select('id')
    .single();
  if (error || !data) return fail('No se pudo registrar el reembolso');
  await logAudit({ action: 'payment.refund', table: 'payments', rowId: (data as any).id, meta: { of: pay.id } });
  touch();
  return ok({ id: (data as any).id });
}

async function buildSnapshot(patientId: string, extra?: FiscalSnapshot['rectification']): Promise<{ snap: FiscalSnapshot; vatRate: number; series: string; patientName: string }> {
  const [s, supabase] = [await getPracticeSettings(), await db()];
  const { data: pat } = await supabase.from('patients').select('full_name,national_id,address').eq('id', patientId).maybeSingle();
  if (!pat) throw new Error('Paciente no encontrado');
  const p = pat as any;
  return {
    snap: {
      issuer: {
        name: s.business_name, legalName: s.legal_name, nif: s.nif, address: s.address,
        collegeNumber: s.college_number, phone: s.phone, email: s.contact_email,
      },
      receiver: { name: p.full_name, nif: p.national_id, address: p.address },
      vatExemptionText: s.vat_exemption_text,
      footer: s.invoice_footer,
      rectification: extra ?? null,
    },
    vatRate: Number(s.default_vat_rate),
    series: s.invoice_series,
    patientName: p.full_name,
  };
}

async function storePdf(invoiceId: string): Promise<void> {
  const supabase = await db();
  const { data } = await supabase.from('invoices').select('*').eq('id', invoiceId).single();
  const inv = data as any;
  const pdf = await renderInvoicePdf(inv);
  const path = `${inv.year}/${inv.number}.pdf`;
  const { error } = await supabase.storage.from('invoices').upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (!error) await supabase.from('invoices').update({ pdf_path: path }).eq('id', invoiceId);
}

/** Emite factura de cobros realizados via RPC issue_invoice (numeracion atomica sin huecos). */
export async function issueInvoiceAction(input: unknown): Promise<ActionResult<{ id: string; number: string }>> {
  await requireAdmin();
  const p = issueInvoiceSchema.safeParse(input);
  if (!p.success) return fail(firstIssue(p.error));
  const v = p.data;
  const supabase = await db();
  const { data: pays } = await supabase
    .from('payments')
    .select('id,amount_cents,patient_id,status,invoice_id')
    .in('id', v.paymentIds);
  const list = (pays ?? []) as any[];
  if (list.length !== v.paymentIds.length) return fail('Algun cobro no existe');
  if (list.some((x) => x.patient_id !== v.patientId || x.status !== 'paid' || x.invoice_id)) {
    return fail('Los cobros deben ser del paciente, estar cobrados y sin factura');
  }
  const total = list.reduce((s, x) => s + x.amount_cents, 0);
  let ctx;
  try {
    ctx = await buildSnapshot(v.patientId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Datos fiscales no disponibles');
  }
  const base = baseFromTotal(total, ctx.vatRate);
  const { data: id, error } = await supabase.rpc('issue_invoice', {
    p_patient: v.patientId, p_concept: v.concept, p_subtotal_cents: base, p_vat_rate: ctx.vatRate,
    p_payment_ids: v.paymentIds, p_series: ctx.series, p_rectifies: null, p_snapshot: ctx.snap,
  });
  if (error || !id) return fail('No se pudo emitir la factura');
  await storePdf(id as string).catch(() => undefined); // el PDF se regenera bajo demanda si falla
  const { data: inv } = await supabase.from('invoices').select('number').eq('id', id as string).single();
  await logAudit({ action: 'invoice.issue', table: 'invoices', rowId: id as string });
  touch();
  return ok({ id: id as string, number: (inv as any)?.number ?? '' });
}

/**
 * Rectificativa total (serie R) que anula la original. La BD exige importes >= 0, asi que la
 * rectificativa refleja el importe a abonar (ver handoff P8). Libera los cobros para refacturar.
 */
export async function rectifyInvoiceAction(input: unknown): Promise<ActionResult<{ id: string; number: string }>> {
  await requireAdmin();
  const p = rectifySchema.safeParse(input);
  if (!p.success) return fail(firstIssue(p.error));
  const v = p.data;
  const supabase = await db();
  const { data: o } = await supabase.from('invoices').select('*').eq('id', v.invoiceId).maybeSingle();
  const orig = o as any;
  if (!orig) return fail('Factura no encontrada');
  if (orig.status !== 'issued') return fail('Solo se rectifican facturas emitidas');
  if (orig.series === 'R') return fail('No se rectifica una rectificativa');
  const { data: dup } = await supabase.from('invoices').select('id').eq('rectifies_id', v.invoiceId).limit(1);
  if ((dup as any[] | null)?.length) return fail('Esta factura ya esta rectificada');
  const settings = await getPracticeSettings();
  const snap = { ...((orig.fiscal_snapshot ?? {}) as FiscalSnapshot), rectification: { originalNumber: orig.number, reason: v.reason } };
  const { data: id, error } = await supabase.rpc('issue_invoice', {
    p_patient: orig.patient_id, p_concept: `Rectificacion de ${orig.number}: ${orig.concept}`,
    p_subtotal_cents: orig.subtotal_cents, p_vat_rate: Number(orig.vat_rate), p_payment_ids: [],
    p_series: 'R', p_rectifies: v.invoiceId, p_snapshot: snap,
  });
  void settings;
  if (error || !id) return fail('No se pudo emitir la rectificativa');
  await supabase.from('invoices').update({ status: 'void' }).eq('id', v.invoiceId);
  await supabase.from('payments').update({ invoice_id: null }).eq('invoice_id', v.invoiceId);
  await storePdf(id as string).catch(() => undefined);
  const { data: inv } = await supabase.from('invoices').select('number').eq('id', id as string).single();
  await logAudit({ action: 'invoice.rectify', table: 'invoices', rowId: id as string, meta: { original: v.invoiceId } });
  touch();
  return ok({ id: id as string, number: (inv as any)?.number ?? '' });
}

/** Envia la factura por email con el PDF adjunto. Asunto y cuerpo neutros (sin datos clinicos). */
export async function sendInvoiceEmailAction(invoiceId: string): Promise<ActionResult<{ to: string }>> {
  await requireAdmin();
  const supabase = await db();
  const { data } = await supabase.from('invoices').select('*, patients(full_name,email)').eq('id', invoiceId).maybeSingle();
  const inv = data as any;
  if (!inv) return fail('Factura no encontrada');
  const to: string | null = inv.patients?.email ?? null;
  if (!to) return fail('El paciente no tiene email en su ficha');
  try {
    const pdf = await renderInvoicePdf(inv);
    const name = (inv.fiscal_snapshot as FiscalSnapshot | null)?.issuer?.name ?? 'Caromafla';
    const res = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Factura ${inv.number}`,
      text: `Hola,\n\nAdjuntamos la factura ${inv.number} por importe de ${formatCents(inv.total_cents)}.\n\nUn saludo,\n${name}`,
      attachments: [{ filename: `${inv.number}.pdf`, content: pdf }],
    });
    if (res.error) return fail('El proveedor de email rechazo el envio');
  } catch {
    return fail('No se pudo enviar el email (revisa RESEND_API_KEY)');
  }
  await logAudit({ action: 'invoice.email', table: 'invoices', rowId: invoiceId });
  return ok({ to });
}
