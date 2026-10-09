import { NextResponse } from 'next/server';
import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { site } from '@/config/site';
import { TZ } from '@/lib/dates';
import { EMAIL_FROM, getResend } from '@/lib/email/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReminderEmail } from '@/modules/booking/email/templates';
import { modalityText, whenText } from '@/modules/booking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron diario (17:00 UTC, vercel.json de P10): recordatorio de las citas de MANANA (hora de Madrid)
 * solo si la persona dio el consentimiento opcional `reminders` y no lo ha retirado. Sin datos clinicos.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true, sent: 0, skipped: 'sin RESEND_API_KEY' });

  const tomorrow = formatInTimeZone(addDays(new Date(), 1), TZ, 'yyyy-MM-dd');
  const dayAfter = formatInTimeZone(addDays(new Date(), 2), TZ, 'yyyy-MM-dd');
  const from = fromZonedTime(`${tomorrow}T00:00:00`, TZ).toISOString();
  const to = fromZonedTime(`${dayAfter}T00:00:00`, TZ).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createAdminClient() as any;
  const { data: appts, error } = await sb
    .from('appointments')
    .select('id,starts_at,modality,requester_name,requester_email,patient_id,services(name),patients(full_name,email)')
    .in('status', ['scheduled', 'confirmed'])
    .is('reminder_sent_at', null)
    .gte('starts_at', from)
    .lt('starts_at', to);
  if (error) {
    console.error('reminders query failed', error.code);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const resend = getResend();
  let sent = 0;
  for (const a of appts ?? []) {
    const { data: consent } = await sb
      .from('consents')
      .select('id')
      .eq('purpose', 'reminders')
      .is('withdrawn_at', null)
      .or(`appointment_id.eq.${a.id}${a.patient_id ? `,patient_id.eq.${a.patient_id}` : ''}`)
      .limit(1);
    if (!consent?.length) continue;
    const email: string | null = a.requester_email ?? a.patients?.email ?? null;
    if (!email) continue;
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Recordatorio de tu cita en ${site.name}`,
        react: ReminderEmail({
          name: a.requester_name ?? a.patients?.full_name ?? '',
          whenText: whenText(new Date(a.starts_at)),
          serviceName: a.services?.name ?? 'Cita',
          modalityText: modalityText(a.modality),
          contactUrl: `${site.url}/contacto`,
        }),
      });
      await sb.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', a.id);
      sent++;
    } catch {
      console.error('reminder send failed'); // sin destinatario ni contenido
    }
  }
  return NextResponse.json({ ok: true, sent });
}
