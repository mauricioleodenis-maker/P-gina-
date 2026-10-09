import 'server-only';
import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns';
import { requireAdmin } from '@/modules/auth/api';
import { getPendingCharges, getRevenueSeries } from '@/modules/billing/api';
import { formatMadrid, fromMadrid, toMadrid } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { db } from './db';
import { requestUrgency } from './calc';
import type {
  ContactMessageItem, DashboardAlert, DashboardKpis, DataRequestItem, Loaded, UpcomingItem,
} from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function settle<T>(p: PromiseLike<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await p };
  } catch {
    return { ok: false };
  }
}

const dayStart = (d: Date) => fromMadrid(startOfDay(toMadrid(d)));
const monthStart = (d: Date) => fromMadrid(startOfMonth(toMadrid(d)));

const toUpcoming = (a: any): UpcomingItem => ({
  id: a.id,
  startsAt: a.starts_at,
  name: a.patients?.full_name ?? a.requester_name ?? 'Paciente',
  serviceName: a.services?.name ?? 'Sesion',
  modality: a.modality,
  status: a.status,
});

const APPT_SEL = 'id,starts_at,status,modality,requester_name,patients(full_name),services(name)';
const ACTIVE = ['scheduled', 'confirmed'];

/** Proximas citas confirmadas/programadas desde ahora. Sin datos clinicos. */
export async function getUpcomingAppointments(limit = 5): Promise<UpcomingItem[]> {
  await requireAdmin();
  const sb = await db();
  const { data, error } = await sb
    .from('appointments')
    .select(APPT_SEL)
    .in('status', ACTIVE)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(limit);
  if (error) throw new Error('No se pudieron leer las citas');
  return ((data ?? []) as any[]).map(toUpcoming);
}

/** KPIs del panel. Cada tarjeta falla de forma independiente (`Loaded`). */
export async function getDashboardKpis(): Promise<DashboardKpis> {
  await requireAdmin();
  const sb = await db();
  const now = new Date();
  const today0 = dayStart(now);
  const tomorrow0 = dayStart(new Date(today0.getTime() + 30 * 3_600_000));
  const m0 = monthStart(now);
  const mNext = monthStart(addDays(m0, 35));
  const mPrev = fromMadrid(addMonths(toMadrid(m0), -1));

  const [appointmentsToday, incomeMonth, activePatients, pendingCharges, nextAppointment, newRequests] = await Promise.all([
    settle(
      (async () => {
        const { count, error } = await sb
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .in('status', ACTIVE.concat('completed'))
          .gte('starts_at', today0.toISOString())
          .lt('starts_at', tomorrow0.toISOString());
        if (error) throw error;
        return count ?? 0;
      })(),
    ),
    settle(
      (async () => {
        const series = await getRevenueSeries({ from: mPrev, to: mNext }, 'month');
        const cur = formatMadrid(now, 'yyyy-MM');
        const prev = formatMadrid(mPrev, 'yyyy-MM');
        return {
          cents: series.find((p) => p.period === cur)?.incomeCents ?? 0,
          previousCents: series.find((p) => p.period === prev)?.incomeCents ?? 0,
        };
      })(),
    ),
    settle(
      (async () => {
        const { count, error } = await sb
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null)
          .is('anonymized_at', null);
        if (error) throw error;
        return count ?? 0;
      })(),
    ),
    settle(
      (async () => {
        const rows = await getPendingCharges();
        return { count: rows.length, balanceCents: rows.reduce((s, r) => s + r.balanceCents, 0) };
      })(),
    ),
    settle(getUpcomingAppointments(1).then((r) => r[0] ?? null)),
    settle(
      (async () => {
        const { count, error } = await sb.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'requested');
        if (error) throw error;
        return count ?? 0;
      })(),
    ),
  ]);
  return { appointmentsToday, incomeMonth, activePatients, pendingCharges, nextAppointment, newRequests };
}

/** Mensajes de contacto (mas recientes primero; sin gestionar arriba). */
export async function listContactMessages(limit = 100): Promise<ContactMessageItem[]> {
  await requireAdmin();
  const sb = await db();
  const { data, error } = await sb
    .from('contact_messages')
    .select('id,name,email,phone,message,handled,created_at')
    .order('handled', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error('No se pudieron leer los mensajes');
  return ((data ?? []) as any[]).map((m) => ({
    id: m.id, name: m.name, email: m.email, phone: m.phone, message: m.message, handled: m.handled, createdAt: m.created_at,
  }));
}

/** Solicitudes de derechos RGPD; abiertas primero, ordenadas por vencimiento. */
export async function listDataRequests(limit = 100): Promise<DataRequestItem[]> {
  await requireAdmin();
  const sb = await db();
  const { data, error } = await sb.from('data_requests').select('*').order('due_at', { ascending: true }).limit(limit);
  if (error) throw new Error('No se pudieron leer las solicitudes');
  const now = new Date();
  const items = ((data ?? []) as any[]).map((r): DataRequestItem => ({
    id: r.id,
    requesterName: r.requester_name,
    requesterEmail: r.requester_email,
    type: r.type,
    status: r.status,
    receivedAt: r.received_at,
    dueAt: r.due_at,
    resolution: r.resolution,
    patientId: r.patient_id,
    ...requestUrgency(r.status, r.due_at, now),
  }));
  return items.sort((a, b) => Number(a.urgency === 'closed') - Number(b.urgency === 'closed'));
}

/** Alertas accionables del dashboard. Tolerante a fallos parciales. */
export async function getDashboardAlerts(kpis?: DashboardKpis): Promise<DashboardAlert[]> {
  await requireAdmin();
  const k = kpis ?? (await getDashboardKpis());
  const alerts: DashboardAlert[] = [];
  const reqs = await settle(listDataRequests());
  if (reqs.ok) {
    const overdue = reqs.value.filter((r) => r.urgency === 'overdue').length;
    const soon = reqs.value.filter((r) => r.urgency === 'soon').length;
    if (overdue) alerts.push({ key: 'rgpd-overdue', tone: 'danger', text: `${overdue} solicitud(es) de derechos RGPD con el plazo legal vencido.`, href: '/admin/mensajes?tab=derechos', cta: 'Revisar' });
    if (soon) alerts.push({ key: 'rgpd-soon', tone: 'warn', text: `${soon} solicitud(es) de derechos vencen en 7 dias o menos.`, href: '/admin/mensajes?tab=derechos', cta: 'Revisar' });
  }
  const msgs = await settle(listContactMessages());
  if (msgs.ok) {
    const n = msgs.value.filter((m) => !m.handled).length;
    if (n) alerts.push({ key: 'msgs', tone: 'warn', text: `${n} mensaje(s) de contacto sin gestionar.`, href: '/admin/mensajes', cta: 'Abrir' });
  }
  if (k.newRequests.ok && k.newRequests.value > 0)
    alerts.push({ key: 'requests', tone: 'warn', text: `${k.newRequests.value} solicitud(es) de cita pendientes de respuesta.`, href: '/admin/solicitudes', cta: 'Responder' });
  if (k.pendingCharges.ok && k.pendingCharges.value.count > 0)
    alerts.push({ key: 'charges', tone: 'warn', text: `${k.pendingCharges.value.count} cobro(s) pendientes por ${formatCents(k.pendingCharges.value.balanceCents)}.`, href: '/admin/ingresos', cta: 'Ver cobros' });
  return alerts;
}
