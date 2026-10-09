import 'server-only';
import { addDays, addWeeks } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { site } from '@/config/site';
import { TZ } from '@/lib/dates';
import { EMAIL_FROM, getResend } from '@/lib/email/client';
import { logAudit } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { buildIcs } from '@/modules/booking/ics';
import { upsertPatientFromBooking } from '@/modules/patients/api';
import { RequestAcceptedEmail, RequestRejectedEmail } from './email/templates';
import { buildRrule, dayBefore, expandOccurrences, localDay, localHHmm, untilFromCount, withLocalTime } from './recurrence';
import { computeAvailability } from './slots';
import {
  AppointmentError,
  type AppointmentView,
  type BlockView,
  type CreateAppointmentInput,
  type RequestView,
  type Scope,
  type Slot,
} from './types';

// Las tablas se validan en la BD (RLS + CHECK + EXCLUDE); tipos finos de P2 pendientes de Integracion.
/* eslint-disable @typescript-eslint/no-explicit-any */
const admin = () => createAdminClient() as any;
const user = async () => (await createClient()) as any;

const OVERLAP = '23P01';
function fail(error: { code?: string; message?: string } | null | undefined, fallback = 'No se pudo guardar la cita'): never {
  if (error?.code === OVERLAP) throw new AppointmentError('overlap', 'Ese horario se solapa con otra cita.');
  console.error('appointments db error', error?.code);
  throw new AppointmentError('server', fallback);
}

const SEL = 'id,patient_id,service_id,series_id,is_exception,starts_at,ends_at,status,modality,price_cents,internal_note,meeting_url,requester_name,services(name),patients(full_name)';

function toView(r: any): AppointmentView {
  return {
    id: r.id, patientId: r.patient_id, name: r.patients?.full_name ?? r.requester_name ?? 'Sin nombre',
    serviceId: r.service_id, serviceName: r.services?.name ?? 'Cita', seriesId: r.series_id, isException: r.is_exception,
    startsAt: r.starts_at, endsAt: r.ends_at, status: r.status, modality: r.modality, priceCents: r.price_cents,
    internalNote: r.internal_note, meetingUrl: r.meeting_url,
  };
}

// ---------------------------------------------------------------- disponibilidad (publica: service_role)
/** Contrato fijo. Reglas - excepciones - busy_slots - buffer, en Europe/Madrid. */
export async function getAvailability(from: Date, to: Date, serviceId: string, modality?: 'in_person' | 'online'): Promise<Slot[]> {
  const sb = admin();
  const [{ data: svc }, { data: st }, { data: rules }, { data: exc }, busy] = await Promise.all([
    sb.from('services').select('duration_min').eq('id', serviceId).eq('active', true).maybeSingle(),
    sb.from('practice_settings').select('slot_step_min,buffer_min,min_notice_hours,max_advance_days').maybeSingle(),
    sb.from('availability_rules').select('*').eq('active', true),
    sb.from('availability_exceptions').select('*').lte('starts_on', localDay(to)).gte('ends_on', localDay(from)),
    sb.rpc('busy_slots', { p_from: from.toISOString(), p_to: to.toISOString() }),
  ]);
  if (!svc || !st) return [];
  if (busy.error) fail(busy.error, 'No se pudo calcular la disponibilidad');
  return computeAvailability({
    from, to, durationMin: svc.duration_min, modality,
    rules: rules ?? [], exceptions: exc ?? [], busy: busy.data ?? [],
    stepMin: st.slot_step_min, bufferMin: st.buffer_min, minNoticeHours: st.min_notice_hours, maxAdvanceDays: st.max_advance_days,
  });
}

// ---------------------------------------------------------------- lectura (admin: RLS)
export async function listAppointments({ from, to }: { from: Date; to: Date }): Promise<AppointmentView[]> {
  const sb = await user();
  const { data, error } = await sb.from('appointments').select(SEL).lt('starts_at', to.toISOString()).gt('ends_at', from.toISOString()).order('starts_at').limit(1500);
  if (error) fail(error, 'No se pudo cargar el calendario');
  return (data ?? []).map(toView);
}

export async function listBlocks({ from, to }: { from: Date; to: Date }): Promise<BlockView[]> {
  const sb = await user();
  const { data } = await sb.from('availability_exceptions').select('id,starts_on,ends_on,is_closed,start_time,end_time').lte('starts_on', localDay(to)).gte('ends_on', localDay(from));
  return (data ?? []).map((b: any) => ({ id: b.id, startsOn: b.starts_on, endsOn: b.ends_on, isClosed: b.is_closed, startTime: b.start_time, endTime: b.end_time }));
}

export async function listFormOptions() {
  const sb = await user();
  const [{ data: patients }, { data: services }] = await Promise.all([
    sb.from('patients').select('id,full_name').is('deleted_at', null).is('anonymized_at', null).order('full_name').limit(2000),
    sb.from('services').select('id,name,duration_min,price_cents,modality').eq('active', true).order('sort_order'),
  ]);
  return {
    patients: (patients ?? []).map((p: any) => ({ id: p.id as string, name: p.full_name as string })),
    services: (services ?? []).map((s: any) => ({ id: s.id as string, name: s.name as string, durationMin: s.duration_min as number, priceCents: s.price_cents as number, modality: s.modality as string })),
  };
}

export async function listRequests(): Promise<RequestView[]> {
  const sb = await user();
  const { data, error } = await sb
    .from('appointments')
    .select('id,starts_at,ends_at,modality,requester_name,requester_email,requester_phone,requester_note,requester_guardian,created_at,services(name)')
    .eq('status', 'requested').order('starts_at').limit(300);
  if (error) fail(error, 'No se pudieron cargar las solicitudes');
  return (data ?? []).map((r: any) => ({
    id: r.id, startsAt: r.starts_at, endsAt: r.ends_at, name: r.requester_name ?? 'Sin nombre', email: r.requester_email,
    phone: r.requester_phone, note: r.requester_note, guardianName: r.requester_guardian?.name ?? null,
    serviceName: r.services?.name ?? 'Cita', modality: r.modality, createdAt: r.created_at,
  }));
}

export async function countRequests(): Promise<number> {
  const sb = await user();
  const { count } = await sb.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'requested');
  return count ?? 0;
}

// ---------------------------------------------------------------- escritura
async function serviceInfo(sb: any, id: string) {
  const { data } = await sb.from('services').select('duration_min,price_cents,modality').eq('id', id).maybeSingle();
  if (!data) throw new AppointmentError('invalid', 'Servicio no encontrado');
  return data as { duration_min: number; price_cents: number; modality: string };
}

export async function createAppointment(input: CreateAppointmentInput): Promise<{ id: string }> {
  const sb = await user();
  const svc = await serviceInfo(sb, input.serviceId);
  const start = new Date(input.startsAt);
  const dur = input.durationMin ?? svc.duration_min;
  const modality = input.modality ?? 'in_person';
  const price = input.priceCents === undefined ? svc.price_cents : input.priceCents;

  if (!input.recurrence) {
    const { data, error } = await sb.from('appointments').insert({
      patient_id: input.patientId, service_id: input.serviceId, starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + dur * 60_000).toISOString(), status: input.status ?? 'scheduled',
      modality, price_cents: price, internal_note: input.internalNote ?? null, meeting_url: input.meetingUrl ?? null,
    }).select('id').single();
    if (error) fail(error);
    await logAudit({ action: 'create_appointment', table: 'appointments', rowId: data.id });
    return { id: data.id };
  }

  const rrule = buildRrule(input.recurrence.frequency);
  const until = input.recurrence.until ?? (input.recurrence.count ? untilFromCount(rrule, start, input.recurrence.count) : null);
  const { data: s } = await sb.from('practice_settings').select('recurrence_weeks').maybeSingle();
  const { data: series, error: e1 } = await sb.from('appointment_series').insert({
    patient_id: input.patientId, service_id: input.serviceId, rrule, dtstart: start.toISOString(), duration_min: dur,
    until, tz: TZ, modality, price_cents: price,
  }).select('*').single();
  if (e1) fail(e1);
  const res = await materializeSeries(sb, series, s?.recurrence_weeks ?? 12, { status: input.status ?? 'scheduled', note: input.internalNote ?? null, meetingUrl: input.meetingUrl ?? null });
  if (res.created === 0) {
    await sb.from('appointment_series').delete().eq('id', series.id);
    throw new AppointmentError('overlap', 'La primera cita se solapa con otra.');
  }
  await logAudit({ action: 'create_series', table: 'appointment_series', rowId: series.id, meta: { created: res.created, conflicts: res.conflicts } });
  const first = await sb.from('appointments').select('id').eq('series_id', series.id).order('starts_at').limit(1).single();
  return { id: first.data.id };
}

/**
 * Materializa citas de una serie desde `materialized_until` hasta hoy + `weeks`. Inserta una a una:
 * un solape (EXCLUDE) solo marca ese dia como conflicto y no aborta el resto.
 * Funciona con cliente de usuario o service_role (cron).
 */
export async function materializeSeries(
  sb: any,
  series: any,
  weeks: number,
  defaults: { status?: string; note?: string | null; meetingUrl?: string | null } = {},
  now: Date = new Date(),
): Promise<{ created: number; conflicts: string[] }> {
  const horizon = addWeeks(now, weeks);
  const dtstart = new Date(series.dtstart);
  const from = series.materialized_until ? new Date(`${series.materialized_until}T22:00:00Z`) : dtstart;
  const startFrom = from < dtstart ? dtstart : from;
  const occ = expandOccurrences({ rrule: series.rrule, dtstart, until: series.until, from: startFrom, to: addDays(horizon, 1) });
  let created = 0;
  const conflicts: string[] = [];
  for (const start of occ) {
    const { error } = await sb.from('appointments').insert({
      patient_id: series.patient_id, service_id: series.service_id, series_id: series.id,
      starts_at: start.toISOString(), ends_at: new Date(start.getTime() + series.duration_min * 60_000).toISOString(),
      status: defaults.status ?? 'scheduled', modality: series.modality, price_cents: series.price_cents,
      internal_note: defaults.note ?? null, meeting_url: defaults.meetingUrl ?? null,
    });
    if (!error) created++;
    else if (error.code === OVERLAP) conflicts.push(localDay(start));
    else fail(error);
  }
  await sb.from('appointment_series').update({ materialized_until: localDay(horizon) }).eq('id', series.id);
  return { created, conflicts };
}

export type UpdatePatch = {
  startsAt?: string;
  durationMin?: number;
  modality?: 'in_person' | 'online';
  status?: 'scheduled' | 'confirmed' | 'completed' | 'no_show';
  priceCents?: number | null;
  internalNote?: string | null;
  meetingUrl?: string | null;
  serviceId?: string;
};

/** Edita una cita. En series: solo esta, esta y siguientes, o toda la serie (futuras). */
export async function updateAppointment(id: string, patch: UpdatePatch, scope: Scope = 'one'): Promise<{ updated: number; conflicts: string[] }> {
  const sb = await user();
  const { data: cur, error } = await sb.from('appointments').select('*').eq('id', id).maybeSingle();
  if (error) fail(error);
  if (!cur) throw new AppointmentError('not_found', 'La cita no existe');

  const base: any = {};
  if (patch.modality) base.modality = patch.modality;
  if (patch.status) base.status = patch.status;
  if (patch.priceCents !== undefined) base.price_cents = patch.priceCents;
  if (patch.internalNote !== undefined) base.internal_note = patch.internalNote;
  if (patch.meetingUrl !== undefined) base.meeting_url = patch.meetingUrl;
  if (patch.serviceId) base.service_id = patch.serviceId;

  if (scope === 'one' || !cur.series_id) {
    const row = { ...base };
    if (patch.startsAt || patch.durationMin) {
      const s = patch.startsAt ? new Date(patch.startsAt) : new Date(cur.starts_at);
      const dur = patch.durationMin ?? (new Date(cur.ends_at).getTime() - new Date(cur.starts_at).getTime()) / 60_000;
      row.starts_at = s.toISOString();
      row.ends_at = new Date(s.getTime() + dur * 60_000).toISOString();
      if (cur.series_id) row.is_exception = true;
    } else if (cur.series_id && Object.keys(base).length) row.is_exception = true;
    const { error: e } = await sb.from('appointments').update(row).eq('id', id);
    if (e) fail(e);
    await logAudit({ action: 'update_appointment', table: 'appointments', rowId: id });
    return { updated: 1, conflicts: [] };
  }

  // Serie: 'following' parte la serie en dos; 'all' afecta a las futuras de la serie actual.
  let seriesId: string = cur.series_id;
  const cutoff = scope === 'all' ? new Date().toISOString() : cur.starts_at;
  const timeChange = patch.startsAt || patch.durationMin;
  const newHHmm = patch.startsAt ? localHHmm(new Date(patch.startsAt)) : null;
  const { data: series } = await sb.from('appointment_series').select('*').eq('id', seriesId).single();

  if (scope === 'following') {
    const day = localDay(new Date(cur.starts_at));
    const { data: ns, error: e } = await sb.from('appointment_series').insert({
      patient_id: series.patient_id, service_id: patch.serviceId ?? series.service_id, rrule: series.rrule,
      dtstart: cur.starts_at, duration_min: series.duration_min, until: series.until, tz: series.tz,
      modality: patch.modality ?? series.modality, price_cents: patch.priceCents !== undefined ? patch.priceCents : series.price_cents,
      materialized_until: series.materialized_until,
    }).select('*').single();
    if (e) fail(e);
    await sb.from('appointment_series').update({ until: dayBefore(day) }).eq('id', seriesId);
    await sb.from('appointments').update({ series_id: ns.id }).eq('series_id', seriesId).gte('starts_at', cur.starts_at);
    seriesId = ns.id;
  }

  const { data: targets } = await sb.from('appointments').select('id,starts_at,ends_at').eq('series_id', seriesId)
    .gte('starts_at', cutoff).in('status', ['requested', 'scheduled', 'confirmed']).order('starts_at');
  let updated = 0;
  const conflicts: string[] = [];
  for (const t of targets ?? []) {
    const row: any = { ...base };
    if (timeChange) {
      const oldStart = new Date(t.starts_at);
      const s = newHHmm ? withLocalTime(oldStart, newHHmm) : oldStart;
      const dur = patch.durationMin ?? (new Date(t.ends_at).getTime() - oldStart.getTime()) / 60_000;
      row.starts_at = s.toISOString();
      row.ends_at = new Date(s.getTime() + dur * 60_000).toISOString();
    }
    if (!Object.keys(row).length) continue;
    const { error: e } = await sb.from('appointments').update(row).eq('id', t.id);
    if (!e) updated++;
    else if (e.code === OVERLAP) conflicts.push(localDay(new Date(t.starts_at)));
    else fail(e);
  }
  const sp: any = {};
  if (newHHmm) sp.dtstart = withLocalTime(new Date(series.dtstart), newHHmm).toISOString();
  if (patch.durationMin) sp.duration_min = patch.durationMin;
  if (patch.modality) sp.modality = patch.modality;
  if (patch.priceCents !== undefined) sp.price_cents = patch.priceCents;
  if (Object.keys(sp).length && scope === 'all') await sb.from('appointment_series').update(sp).eq('id', seriesId);
  else if (Object.keys(sp).length) await sb.from('appointment_series').update({ ...sp, dtstart: undefined }).eq('id', seriesId);
  await logAudit({ action: 'update_series', table: 'appointment_series', rowId: seriesId, meta: { scope, updated, conflicts: conflicts.length } });
  return { updated, conflicts };
}

/** Arrastrar/redimensionar. Marca la ocurrencia como excepcion si es de una serie. */
export async function moveAppointment(id: string, startsAt: string, endsAt: string): Promise<void> {
  const sb = await user();
  const { data: cur } = await sb.from('appointments').select('series_id').eq('id', id).maybeSingle();
  if (!cur) throw new AppointmentError('not_found', 'La cita no existe');
  if (new Date(endsAt) <= new Date(startsAt)) throw new AppointmentError('invalid', 'Horario no valido');
  const { error } = await sb.from('appointments').update({ starts_at: startsAt, ends_at: endsAt, ...(cur.series_id ? { is_exception: true } : {}) }).eq('id', id);
  if (error) fail(error);
  await logAudit({ action: 'move_appointment', table: 'appointments', rowId: id });
}

export async function cancelAppointment(id: string, scope: Scope = 'one', reason?: string): Promise<{ cancelled: number }> {
  const sb = await user();
  const { data: cur } = await sb.from('appointments').select('series_id,starts_at').eq('id', id).maybeSingle();
  if (!cur) throw new AppointmentError('not_found', 'La cita no existe');
  const patch = { status: 'cancelled', cancel_reason: reason?.slice(0, 300) ?? null };
  if (scope === 'one' || !cur.series_id) {
    const { error } = await sb.from('appointments').update(patch).eq('id', id);
    if (error) fail(error);
    await logAudit({ action: 'cancel_appointment', table: 'appointments', rowId: id });
    return { cancelled: 1 };
  }
  const cutoff = scope === 'all' ? new Date().toISOString() : cur.starts_at;
  const { data, error } = await sb.from('appointments').update(patch).eq('series_id', cur.series_id).gte('starts_at', cutoff)
    .in('status', ['requested', 'scheduled', 'confirmed']).select('id');
  if (error) fail(error);
  await sb.from('appointment_series').update(scope === 'all' ? { active: false } : { until: dayBefore(localDay(new Date(cur.starts_at))) }).eq('id', cur.series_id);
  await logAudit({ action: 'cancel_series', table: 'appointment_series', rowId: cur.series_id, meta: { scope, cancelled: data?.length ?? 0 } });
  return { cancelled: data?.length ?? 0 };
}

export async function markCompleted(id: string): Promise<void> {
  const sb = await user();
  const { error } = await sb.from('appointments').update({ status: 'completed' }).eq('id', id).in('status', ['scheduled', 'confirmed']);
  if (error) fail(error);
  await logAudit({ action: 'complete_appointment', table: 'appointments', rowId: id });
}

// ---------------------------------------------------------------- solicitudes
const whenText = (d: Date) => formatInTimeZone(d, TZ, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
const modalityText = (m: string) => (m === 'online' ? 'Online (te enviaré el enlace de la videollamada)' : `Presencial · ${site.contact.address}`);

/** Acepta: crea/vincula la ficha (C17), pasa a 'scheduled' y avisa por email con .ics. */
export async function acceptRequest(id: string): Promise<{ patientId: string; emailSent: boolean }> {
  const sb = await user();
  const { data: a, error } = await sb.from('appointments').select('*,services(name)').eq('id', id).maybeSingle();
  if (error) fail(error);
  if (!a || a.status !== 'requested') throw new AppointmentError('not_found', 'La solicitud ya no está pendiente');
  if (!a.requester_email || !a.requester_name) throw new AppointmentError('invalid', 'Faltan datos de contacto');

  const { id: patientId } = await upsertPatientFromBooking({
    name: a.requester_name, email: a.requester_email, phone: a.requester_phone ?? undefined,
    guardian: a.requester_guardian ?? undefined, appointmentId: a.id,
  });
  const { error: e2 } = await sb.from('appointments').update({ patient_id: patientId, status: 'scheduled' }).eq('id', id).eq('status', 'requested');
  if (e2) fail(e2);
  await logAudit({ action: 'accept_request', table: 'appointments', rowId: id });

  const emailSent = await sendDecisionEmail(a, true);
  return { patientId, emailSent };
}

export async function rejectRequest(id: string, reason?: string): Promise<{ emailSent: boolean }> {
  const sb = await user();
  const { data: a } = await sb.from('appointments').select('*,services(name)').eq('id', id).maybeSingle();
  if (!a || a.status !== 'requested') throw new AppointmentError('not_found', 'La solicitud ya no está pendiente');
  const { error } = await sb.from('appointments').update({ status: 'cancelled', cancel_reason: reason?.slice(0, 300) ?? null }).eq('id', id).eq('status', 'requested');
  if (error) fail(error);
  await logAudit({ action: 'reject_request', table: 'appointments', rowId: id });
  return { emailSent: await sendDecisionEmail(a, false) };
}

async function sendDecisionEmail(a: any, accepted: boolean): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !a.requester_email) return false;
  const start = new Date(a.starts_at);
  const serviceName = a.services?.name ?? 'Cita';
  try {
    if (accepted) {
      const ics = buildIcs({ uid: a.id, startsAt: start, endsAt: new Date(a.ends_at), summary: `Cita en ${site.name}`, modality: a.modality });
      await getResend().emails.send({
        from: EMAIL_FROM, to: a.requester_email, subject: `Cita confirmada en ${site.name}`,
        react: RequestAcceptedEmail({ name: a.requester_name ?? '', whenText: whenText(start), serviceName, modalityText: modalityText(a.modality) }),
        attachments: ics ? [{ filename: 'cita.ics', content: Buffer.from(ics).toString('base64') }] : undefined,
      });
    } else {
      await getResend().emails.send({
        from: EMAIL_FROM, to: a.requester_email, subject: `Sobre tu solicitud en ${site.name}`,
        react: RequestRejectedEmail({ name: a.requester_name ?? '', whenText: whenText(start), serviceName, bookUrl: `${site.url}/reservar` }),
      });
    }
    return true;
  } catch {
    console.error('decision email failed'); // sin destinatario ni contenido
    return false;
  }
}
