import 'server-only';
import { db } from './db';
import { logAudit } from '@/lib/audit';
import { matchesQuery } from './search';
import type { Guardian, PatientDetail, PatientListItem, TimelineEvent } from './types';
import { APPT_STATUS_LABEL, PURPOSE_LABEL } from './types';

const LIST_COLS = 'id,full_name,email,phone,status,modality,tags,birth_date,guardian,restricted,created_at';

/**
 * Contrato fijo (PLAN s.9). Lista pacientes no eliminados; la busqueda sin acentos se hace
 * en servidor sobre la lista (consulta unipersonal: cientos de filas, no millones).
 * Sin datos clinicos: solo columnas administrativas.
 */
export async function listPatients(q?: string): Promise<PatientListItem[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from('patients')
    .select(LIST_COLS)
    .is('deleted_at', null)
    .order('full_name', { ascending: true })
    .limit(2000);
  if (error) throw new Error('No se pudo cargar la lista de pacientes');
  const rows = (data ?? []) as PatientListItem[];
  const query = q?.trim();
  if (!query) return rows;
  return rows.filter((p) => matchesQuery([p.full_name, p.email, p.phone, ...(p.tags ?? [])], query));
}

/** Contrato fijo. Devuelve la ficha (o null) y audita la lectura. */
export async function getPatient(id: string): Promise<PatientDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await db();
  const { data, error } = await supabase.from('patients').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error || !data) return null;
  await logAudit({ action: 'read_patient', table: 'patients', rowId: id });
  return data as PatientDetail;
}

/**
 * Contrato fijo. Crea la ficha al ACEPTAR una solicitud (C17). Si ya existe un paciente con ese
 * correo la reutiliza. Enlaza consentimientos y cita de origen. Lo invoca P7 (admin autenticado).
 */
export async function upsertPatientFromBooking(input: {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  guardian?: unknown;
  appointmentId: string;
}): Promise<{ id: string }> {
  const supabase = await db();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('email', email)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  let id = existing?.id as string | undefined;
  if (!id) {
    const guardian = isGuardian(input.guardian) ? input.guardian : null;
    const { data, error } = await supabase
      .from('patients')
      .insert({
        full_name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        birth_date: input.birthDate || null,
        guardian,
        consent_data: true,
        consent_data_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error || !data) throw new Error('No se pudo crear la ficha del paciente');
    id = data.id as string;
  }

  await supabase.from('consents').update({ patient_id: id }).eq('appointment_id', input.appointmentId).is('patient_id', null);
  await supabase.from('appointments').update({ patient_id: id }).eq('id', input.appointmentId).is('patient_id', null);
  return { id };
}

function isGuardian(g: unknown): g is Guardian {
  return !!g && typeof g === 'object' && typeof (g as Guardian).name === 'string';
}

/** Linea de tiempo: citas, notas (solo fecha/plantilla, nunca contenido) y consentimientos. */
export async function getTimeline(patientId: string): Promise<TimelineEvent[]> {
  const supabase = await db();
  const [appts, notes, consents, services] = await Promise.all([
    supabase.from('appointments').select('id,starts_at,status,service_id').eq('patient_id', patientId).order('starts_at', { ascending: false }).limit(100),
    supabase.from('session_notes').select('id,created_at,template').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(100),
    supabase.from('consents').select('id,purpose,given_at,withdrawn_at').eq('patient_id', patientId).order('given_at', { ascending: false }).limit(100),
    supabase.from('services').select('id,name'),
  ]);
  const svc = new Map((services.data ?? []).map((s) => [s.id as string, s.name as string]));
  const ev: TimelineEvent[] = [];
  for (const a of appts.data ?? []) {
    ev.push({
      id: `a-${a.id}`,
      at: a.starts_at as string,
      kind: 'appointment',
      title: svc.get(a.service_id as string) ?? 'Sesion',
      detail: APPT_STATUS_LABEL[a.status as string] ?? (a.status as string),
    });
  }
  for (const n of notes.data ?? []) {
    ev.push({
      id: `n-${n.id}`,
      at: n.created_at as string,
      kind: 'note',
      title: 'Nota de sesion',
      detail: n.template === 'soap' ? 'Plantilla SOAP' : 'Nota libre',
      href: `/admin/pacientes/${patientId}/notas?n=${n.id}`,
    });
  }
  for (const c of consents.data ?? []) {
    ev.push({
      id: `c-${c.id}`,
      at: c.given_at as string,
      kind: 'consent',
      title: PURPOSE_LABEL[c.purpose as keyof typeof PURPOSE_LABEL] ?? (c.purpose as string),
      detail: c.withdrawn_at ? 'Retirado' : 'Otorgado',
    });
  }
  return ev.sort((x, y) => y.at.localeCompare(x.at));
}
