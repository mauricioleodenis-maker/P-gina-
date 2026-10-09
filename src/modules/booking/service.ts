import 'server-only';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { site } from '@/config/site';
import { TZ } from '@/lib/dates';
import { getResend, EMAIL_FROM } from '@/lib/email/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAvailability } from '@/modules/appointments/api';
import { computeSlots, type Busy, type Exception, type Rule } from './availability';
import { buildIcs } from './ics';
import { bookingSchema, CONSENT_TEXT_VERSION, type BookingInput } from './schema';
import { generateManageToken, hashIp, hashToken, isWellFormedToken } from './token';
import type { BookingErrorCode, BookingSummary, PublicSlot } from './types';
import { BookingConfirmationEmail, CancellationEmail, ProfessionalNoticeEmail } from './email/templates';

// Cliente sin tipos estrictos: las RPC/tablas se validan en la BD (types de P2 pendientes de revision en Integracion).
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = () => createAdminClient() as any;

export type BookingResult =
  | { ok: true; token: string; startsAt: string }
  | { ok: false; code: BookingErrorCode; message: string; alternatives?: PublicSlot[] };

const MESSAGES: Record<BookingErrorCode, string> = {
  validation: 'Revisa los datos marcados.',
  rate_limited: 'Demasiados intentos. Prueba de nuevo en unos minutos.',
  captcha: 'No hemos podido verificar que eres una persona. Inténtalo de nuevo.',
  slot_taken: 'Ese hueco acaba de ocuparse. Te propongo los siguientes disponibles.',
  too_soon: 'Ese hueco ya es demasiado próximo para reservarlo online. Elige otro o escríbeme.',
  too_far: 'Ese día aún no admite reservas. Elige una fecha más cercana.',
  invalid_service: 'El servicio elegido ya no está disponible.',
  server: 'No se ha podido enviar la solicitud. Inténtalo de nuevo en unos minutos o escríbeme.',
};
export const bookingMessage = (c: BookingErrorCode) => MESSAGES[c];

export function modalityText(m: 'in_person' | 'online'): string {
  return m === 'online' ? 'Online (te enviaré el enlace de la videollamada)' : `Presencial · ${site.contact.address}`;
}
export function whenText(d: Date): string {
  return formatInTimeZone(d, TZ, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
}

/** Huecos libres: P7 (`getAvailability`); si aun es un stub, calculo local equivalente. */
export async function getPublicSlots(from: Date, to: Date, serviceId: string, modality?: 'in_person' | 'online'): Promise<PublicSlot[]> {
  try {
    const slots = await getAvailability(from, to, serviceId);
    return slots.map((s) => ({ start: new Date(s.start).toISOString(), end: new Date(s.end).toISOString() }));
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes('no implementado')) throw e;
  }
  const sb = db();
  const [{ data: svc }, { data: st }, { data: rules }, { data: exc }, busyRes] = await Promise.all([
    sb.from('services').select('duration_min').eq('id', serviceId).eq('active', true).maybeSingle(),
    sb.from('practice_settings').select('slot_step_min,buffer_min,min_notice_hours,max_advance_days').maybeSingle(),
    sb.from('availability_rules').select('*').eq('active', true),
    sb.from('availability_exceptions').select('*').lte('starts_on', to.toISOString().slice(0, 10)).gte('ends_on', from.toISOString().slice(0, 10)),
    sb.rpc('busy_slots', { p_from: from.toISOString(), p_to: to.toISOString() }),
  ]);
  if (!svc) return [];
  return computeSlots({
    from,
    to,
    durationMin: svc.duration_min,
    modality,
    rules: (rules ?? []) as Rule[],
    exceptions: (exc ?? []) as Exception[],
    busy: ((busyRes as { data: Busy[] | null }).data ?? []) as Busy[],
    stepMin: st?.slot_step_min ?? 15,
    bufferMin: st?.buffer_min ?? 10,
    minNoticeHours: st?.min_notice_hours ?? 12,
    maxAdvanceDays: st?.max_advance_days ?? 60,
  });
}

/** Crea la solicitud (cita `requested` + consents) via RPC `request_appointment`. FR-002/FR-007. */
export async function submitBooking(raw: unknown, ctx: { ip: string }): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'validation', message: MESSAGES.validation };
  const input: BookingInput = parsed.data;
  const { token, hash } = generateManageToken();
  const guardian = input.adult ? null : input.guardian ?? null;

  const { data, error } = await db().rpc('request_appointment', {
    p_service: input.serviceId,
    p_starts: new Date(input.startsAt).toISOString(),
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone || null,
    p_modality: input.modality,
    p_consent_privacy: input.consentPrivacy,
    p_consent_health: input.consentHealth,
    p_consent_reminders: input.consentReminders,
    p_note: input.note || null,
    p_guardian: guardian,
    p_token_hash: hash,
    p_ip_hash: hashIp(ctx.ip),
    p_text_version: CONSENT_TEXT_VERSION,
  });

  if (error) {
    const msg = String(error.message ?? '');
    const code: BookingErrorCode =
      error.code === '23P01' || msg.includes('appointments_no_overlap')
        ? 'slot_taken'
        : (['too_soon', 'too_far', 'invalid_service'] as const).find((c) => msg.includes(c)) ?? (msg.includes('consent_required') || /invalid_(email|name|modality)/.test(msg) ? 'validation' : 'server');
    if (code === 'server') console.error('request_appointment failed', error.code); // nunca el contenido
    if (code === 'slot_taken') {
      const from = new Date(input.startsAt);
      const alt = await getPublicSlots(from, new Date(from.getTime() + 14 * 86_400_000), input.serviceId, input.modality).catch(() => []);
      return { ok: false, code, message: MESSAGES.slot_taken, alternatives: alt.filter((s) => s.start !== new Date(input.startsAt).toISOString()).slice(0, 3) };
    }
    return { ok: false, code, message: MESSAGES[code] };
  }

  const appointmentId = String(data);
  await sendBookingEmails({ appointmentId, token, name: input.name, email: input.email }).catch((e) =>
    console.error('booking emails failed', e instanceof Error ? e.name : 'error'),
  );
  return { ok: true, token, startsAt: new Date(input.startsAt).toISOString() };
}

async function loadAppointment(id: string) {
  const { data } = await db()
    .from('appointments')
    .select('id,starts_at,ends_at,modality,status,requester_name,requester_email,services(name)')
    .eq('id', id)
    .maybeSingle();
  return data as null | {
    id: string; starts_at: string; ends_at: string; modality: 'in_person' | 'online'; status: string;
    requester_name: string | null; requester_email: string | null; services: { name: string } | null;
  };
}

/** Contrato `booking/api.ts`. Confirmacion con .ics a quien reserva y aviso neutro a la profesional. Sin RESEND_API_KEY no envia. */
export async function sendBookingEmails(args: { appointmentId: string; token: string; name: string; email: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY ausente: emails de reserva no enviados');
    return;
  }
  const a = await loadAppointment(args.appointmentId);
  if (!a) return;
  const start = new Date(a.starts_at);
  const end = new Date(a.ends_at);
  const serviceName = a.services?.name ?? 'Cita';
  const when = whenText(start);
  const resend = getResend();
  const ics = buildIcs({ uid: a.id, startsAt: start, endsAt: end, summary: `Cita en ${site.name}`, modality: a.modality });
  const { data: st } = await db().from('practice_settings').select('auto_confirm,contact_email').maybeSingle();

  await resend.emails.send({
    from: EMAIL_FROM,
    to: args.email,
    subject: `Tu solicitud de cita en ${site.name}`,
    react: BookingConfirmationEmail({
      name: args.name, whenText: when, serviceName, modalityText: modalityText(a.modality),
      manageUrl: `${site.url}/reservar/confirmacion/${args.token}`, autoConfirmed: Boolean(st?.auto_confirm),
    }),
    attachments: ics ? [{ filename: 'cita.ics', content: Buffer.from(ics).toString('base64') }] : undefined,
  });

  const proEmail = (st?.contact_email as string | undefined) || (site.contact.email.startsWith('TODO_REAL') ? undefined : site.contact.email);
  if (proEmail) {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: proEmail,
      subject: 'Nueva solicitud de cita',
      react: ProfessionalNoticeEmail({ whenText: when, serviceName, adminUrl: `${site.url}/admin/solicitudes` }),
    });
  }
}

export async function getBookingByToken(token: string): Promise<BookingSummary | null> {
  if (!isWellFormedToken(token)) return null;
  const sb = db();
  const [{ data: a }, { data: st }] = await Promise.all([
    sb.from('appointments').select('starts_at,ends_at,modality,status,services(name)').eq('manage_token_hash', hashToken(token)).maybeSingle(),
    sb.from('practice_settings').select('cancellation_hours').maybeSingle(),
  ]);
  if (!a) return null;
  const hours = st?.cancellation_hours ?? 24;
  const cancellable =
    ['requested', 'scheduled', 'confirmed'].includes(a.status) && new Date(a.starts_at).getTime() - Date.now() > hours * 3_600_000;
  return {
    status: a.status, startsAt: a.starts_at, endsAt: a.ends_at, modality: a.modality,
    serviceName: a.services?.name ?? 'Cita', cancellable, cancellationHours: hours,
  };
}

export async function cancelByToken(token: string): Promise<{ ok: boolean; message: string }> {
  const summary = await getBookingByToken(token);
  if (!summary) return { ok: false, message: 'No encuentro esa cita.' };
  if (!summary.cancellable) {
    return { ok: false, message: `Ya no se puede cancelar online (menos de ${summary.cancellationHours} h). Escríbeme y lo vemos.` };
  }
  const sb = db();
  const { data, error } = await sb
    .from('appointments')
    .update({ status: 'cancelled', cancel_reason: 'Cancelada por la persona (enlace del correo)' })
    .eq('manage_token_hash', hashToken(token))
    .in('status', ['requested', 'scheduled', 'confirmed'])
    .select('requester_name,requester_email')
    .maybeSingle();
  if (error || !data) return { ok: false, message: 'No se ha podido cancelar. Inténtalo de nuevo o escríbeme.' };

  if (process.env.RESEND_API_KEY && data.requester_email) {
    const start = new Date(summary.startsAt);
    await getResend()
      .emails.send({
        from: EMAIL_FROM,
        to: data.requester_email,
        subject: `Cita cancelada en ${site.name}`,
        react: CancellationEmail({ name: data.requester_name ?? '', whenText: whenText(start), serviceName: summary.serviceName, bookUrl: `${site.url}/reservar` }),
      })
      .catch(() => undefined);
  }
  return { ok: true, message: 'Tu cita ha quedado cancelada.' };
}
