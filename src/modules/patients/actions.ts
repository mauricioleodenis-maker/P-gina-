'use server';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/modules/auth/api';
import { db } from './db';
import { logAudit } from '@/lib/audit';
import type { ActionResult, FormState } from '@/modules/auth/types';
import { consentSchema, dataRequestUpdateSchema, noteSchema, patientSchema } from './schemas';
import { listVersions, readNote, readVersion, writeNote } from './notes';

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === 'string' ? v : '';
};

function parsePatientForm(fd: FormData) {
  const hasGuardian = fd.get('has_guardian') === 'on';
  return patientSchema.safeParse({
    full_name: str(fd, 'full_name'),
    email: str(fd, 'email'),
    phone: str(fd, 'phone'),
    birth_date: str(fd, 'birth_date'),
    national_id: str(fd, 'national_id'),
    address: str(fd, 'address'),
    emergency_contact: str(fd, 'emergency_contact'),
    modality: str(fd, 'modality') || 'in_person',
    default_price_euros: str(fd, 'default_price_euros'),
    tags: str(fd, 'tags'),
    status: str(fd, 'status') || 'active',
    internal_notes: str(fd, 'internal_notes'),
    consent_data: fd.get('consent_data') === 'on',
    guardian: hasGuardian
      ? {
          name: str(fd, 'g_name'),
          relationship: str(fd, 'g_relationship'),
          email: str(fd, 'g_email'),
          phone: str(fd, 'g_phone'),
          national_id: str(fd, 'g_national_id'),
        }
      : null,
  });
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.length > 1 && i.path[0] === 'guardian' ? `g_${String(i.path[1])}` : String(i.path[0] ?? 'form');
    out[k] ??= i.message;
  }
  return out;
}

function toRow(p: NonNullable<ReturnType<typeof parsePatientForm>['data']>) {
  const { default_price_euros, consent_data, ...rest } = p;
  return {
    ...rest,
    default_price_cents: default_price_euros,
    consent_data,
    consent_data_at: consent_data ? new Date().toISOString() : null,
    guardian: p.guardian ?? null,
  };
}

export async function createPatientAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePatientForm(fd);
  if (!parsed.success) return { error: 'Revisa los campos marcados.', fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await db();
  const { data, error } = await supabase.from('patients').insert(toRow(parsed.data)).select('id').single();
  if (error || !data) return { error: 'No se pudo crear el paciente.' };
  revalidatePath('/admin/pacientes');
  redirect(`/admin/pacientes/${data.id}`);
}

export async function updatePatientAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parsePatientForm(fd);
  if (!parsed.success) return { error: 'Revisa los campos marcados.', fieldErrors: fieldErrors(parsed.error.issues) };
  const supabase = await db();
  const prevRow = await supabase.from('patients').select('consent_data,consent_data_at,anonymized_at').eq('id', id).maybeSingle();
  if (prevRow.data?.anonymized_at) return { error: 'La ficha esta anonimizada y no se puede editar.' };
  const row = toRow(parsed.data);
  if (prevRow.data?.consent_data && row.consent_data) row.consent_data_at = prevRow.data.consent_data_at;
  const { error } = await supabase.from('patients').update(row).eq('id', id);
  if (error) return { error: 'No se pudo guardar la ficha.' };
  await logAudit({ action: 'update_patient', table: 'patients', rowId: id });
  revalidatePath(`/admin/pacientes/${id}`);
  revalidatePath('/admin/pacientes');
  return { ok: true };
}

export async function setRestrictedAction(id: string, restricted: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await db();
  const { error } = await supabase.from('patients').update({ restricted }).eq('id', id);
  if (error) return { ok: false, error: 'No se pudo actualizar la limitacion.' };
  await logAudit({ action: restricted ? 'restrict_patient' : 'unrestrict_patient', table: 'patients', rowId: id });
  revalidatePath(`/admin/pacientes/${id}`);
  return { ok: true };
}

/* ---------------- Notas ---------------- */

export async function saveNoteAction(input: unknown): Promise<ActionResult<{ noteId: string; updatedAt: string }>> {
  const { userId } = await requireAdmin();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos no validos' };
  const res = await writeNote(userId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };
  await logAudit({ action: parsed.data.noteId ? 'update_note' : 'create_note', table: 'session_notes', rowId: res.noteId });
  revalidatePath(`/admin/pacientes/${parsed.data.patientId}`);
  return { ok: true, data: { noteId: res.noteId, updatedAt: res.updatedAt } };
}

/** Desbloqueo del editor tras inactividad: relee y audita. */
export async function unlockNoteAction(patientId: string, noteId: string): Promise<ActionResult<{ body: string; updatedAt: string }>> {
  await requireAdmin();
  const note = await readNote(patientId, noteId);
  if (!note) return { ok: false, error: 'Nota no encontrada.' };
  return { ok: true, data: { body: note.body, updatedAt: note.updatedAt } };
}

export async function versionsAction(noteId: string) {
  await requireAdmin();
  return listVersions(noteId);
}

export async function readVersionAction(patientId: string, noteId: string, versionId: string): Promise<ActionResult<{ body: string; savedAt: string }>> {
  await requireAdmin();
  const v = await readVersion(patientId, noteId, versionId);
  return v ? { ok: true, data: v } : { ok: false, error: 'Version no encontrada.' };
}

/* ---------------- Consentimientos ---------------- */

const MAX_PDF = 5 * 1024 * 1024;

export async function uploadConsentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = consentSchema.safeParse({
    patientId: str(fd, 'patientId'),
    purpose: str(fd, 'purpose'),
    textVersion: str(fd, 'textVersion'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos no validos' };
  const file = fd.get('file');
  let path: string | null = null;
  const supabase = await db();

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_PDF) return { error: 'El PDF supera 5 MB.' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPdf = bytes.length > 4 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
    if (!isPdf) return { error: 'El archivo debe ser un PDF valido.' };
    path = `${parsed.data.patientId}/${randomUUID()}.pdf`;
    const { error: upErr } = await supabase.storage.from('consents').upload(path, bytes, { contentType: 'application/pdf', upsert: false });
    if (upErr) return { error: 'No se pudo subir el PDF.' };
  }

  const { data, error } = await supabase
    .from('consents')
    .insert({
      patient_id: parsed.data.patientId,
      purpose: parsed.data.purpose,
      text_version: parsed.data.textVersion,
      document_path: path,
    })
    .select('id')
    .single();
  if (error || !data) {
    if (path) await supabase.storage.from('consents').remove([path]);
    return { error: 'No se pudo registrar el consentimiento.' };
  }
  await logAudit({ action: 'create_consent', table: 'consents', rowId: data.id as string });
  revalidatePath(`/admin/pacientes/${parsed.data.patientId}`);
  return { ok: true };
}

/** URL firmada de 60 s para ver el PDF de un consentimiento (se audita). */
export async function consentUrlAction(consentId: string): Promise<ActionResult<{ url: string }>> {
  await requireAdmin();
  const supabase = await db();
  const { data } = await supabase.from('consents').select('document_path').eq('id', consentId).maybeSingle();
  if (!data?.document_path) return { ok: false, error: 'Este consentimiento no tiene PDF.' };
  const { data: signed, error } = await supabase.storage.from('consents').createSignedUrl(data.document_path as string, 60);
  if (error || !signed) return { ok: false, error: 'No se pudo generar el enlace.' };
  await logAudit({ action: 'read_consent_document', table: 'consents', rowId: consentId });
  return { ok: true, data: { url: signed.signedUrl } };
}

export async function withdrawConsentAction(consentId: string, patientId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await db();
  const { error } = await supabase.from('consents').update({ withdrawn_at: new Date().toISOString() }).eq('id', consentId).is('withdrawn_at', null);
  if (error) return { ok: false, error: 'No se pudo retirar el consentimiento.' };
  await logAudit({ action: 'withdraw_consent', table: 'consents', rowId: consentId });
  revalidatePath(`/admin/pacientes/${patientId}`);
  return { ok: true };
}

/* ---------------- Derechos RGPD ---------------- */

export async function updateDataRequestAction(patientId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = dataRequestUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos no validos' };
  const { id, status, resolution } = parsed.data;
  const supabase = await db();
  const { error } = await supabase
    .from('data_requests')
    .update({
      status,
      resolution: resolution || null,
      resolved_at: status === 'in_progress' ? null : new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: 'No se pudo actualizar la solicitud.' };
  await logAudit({ action: 'update_data_request', table: 'data_requests', rowId: id, meta: { status } });
  revalidatePath(`/admin/pacientes/${patientId}`);
  return { ok: true };
}

/* ---------------- Anonimizar ---------------- */

/**
 * Anonimiza los datos identificativos. Las notas cifradas se CONSERVAN (retencion legal de la
 * historia clinica >= 5 anios, TODO_REAL segun CCAA); quedan sin identidad asociada.
 */
export async function anonymizePatientAction(id: string, confirmName: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await db();
  const { data: p } = await supabase.from('patients').select('full_name,anonymized_at').eq('id', id).maybeSingle();
  if (!p) return { ok: false, error: 'Paciente no encontrado.' };
  if (p.anonymized_at) return { ok: false, error: 'Ya esta anonimizado.' };
  if (confirmName.trim() !== p.full_name) return { ok: false, error: 'El nombre no coincide.' };
  const { error } = await supabase
    .from('patients')
    .update({
      full_name: 'Paciente anonimizado',
      email: null, phone: null, birth_date: null, national_id: null, address: null,
      emergency_contact: null, guardian: null, internal_notes: null, tags: [],
      status: 'discharged', restricted: true, consent_marketing: false,
      anonymized_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: 'No se pudo anonimizar.' };
  await logAudit({ action: 'anonymize_patient', table: 'patients', rowId: id });
  revalidatePath(`/admin/pacientes/${id}`);
  revalidatePath('/admin/pacientes');
  return { ok: true };
}
