import 'server-only';
import { db } from './db';
import { logAudit } from '@/lib/audit';
import { decryptNote, encryptNote, toPgBytea } from '@/lib/crypto';
import type { NoteFull, NoteMeta, NoteVersionMeta } from './types';

type NoteMetaRow = {
  id: string; template: 'free' | 'soap'; appointment_id: string | null; created_at: string; updated_at: string; key_version: number;
};
const toMeta = (r: NoteMetaRow): NoteMeta => ({
  id: r.id, template: r.template, appointmentId: r.appointment_id, createdAt: r.created_at, updatedAt: r.updated_at, keyVersion: r.key_version,
});

/** Lista notas SIN descifrar (no se lee ni se audita contenido). */
export async function listNotes(patientId: string): Promise<NoteMeta[]> {
  const supabase = await db();
  const { data } = await supabase
    .from('session_notes')
    .select('id,template,appointment_id,created_at,updated_at,key_version')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return ((data ?? []) as NoteMetaRow[]).map(toMeta);
}

/** Lee y descifra una nota. Audita SIEMPRE la lectura (sin contenido en meta). */
export async function readNote(patientId: string, noteId: string): Promise<NoteFull | null> {
  const supabase = await db();
  const { data } = await supabase
    .from('session_notes')
    .select('id,template,appointment_id,created_at,updated_at,key_version,body_enc')
    .eq('id', noteId)
    .eq('patient_id', patientId)
    .maybeSingle();
  if (!data) return null;
  const row = data as NoteMetaRow & { body_enc: string };
  const body = decryptNote(row.body_enc, row.key_version, { patientId });
  await logAudit({ action: 'read_note', table: 'session_notes', rowId: noteId });
  return { ...toMeta(row), body };
}

export async function listVersions(noteId: string): Promise<NoteVersionMeta[]> {
  const supabase = await db();
  const { data } = await supabase
    .from('session_note_versions')
    .select('id,saved_at,key_version')
    .eq('note_id', noteId)
    .order('saved_at', { ascending: false })
    .limit(50);
  return (data ?? []).map((v) => ({ id: v.id as string, savedAt: v.saved_at as string, keyVersion: v.key_version as number }));
}

export async function readVersion(patientId: string, noteId: string, versionId: string): Promise<{ body: string; savedAt: string } | null> {
  const supabase = await db();
  const { data: note } = await supabase.from('session_notes').select('id').eq('id', noteId).eq('patient_id', patientId).maybeSingle();
  if (!note) return null;
  const { data } = await supabase
    .from('session_note_versions')
    .select('body_enc,key_version,saved_at')
    .eq('id', versionId)
    .eq('note_id', noteId)
    .maybeSingle();
  if (!data) return null;
  const body = decryptNote(data.body_enc as string, data.key_version as number, { patientId });
  await logAudit({ action: 'read_note_version', table: 'session_note_versions', rowId: versionId });
  return { body, savedAt: data.saved_at as string };
}

export type SaveResult =
  | { ok: true; noteId: string; updatedAt: string }
  | { ok: false; error: string; conflict?: boolean };

/** Crea o edita una nota. Al editar guarda la version anterior (cifrada) y detecta conflictos. */
export async function writeNote(
  userId: string,
  input: { patientId: string; noteId?: string; template: 'free' | 'soap'; body: string; appointmentId?: string | null; expectedUpdatedAt?: string },
): Promise<SaveResult> {
  const supabase = await db();
  const { bodyEnc, keyVersion } = encryptNote(input.body, { patientId: input.patientId });

  if (!input.noteId) {
    const { data, error } = await supabase
      .from('session_notes')
      .insert({
        patient_id: input.patientId,
        appointment_id: input.appointmentId ?? null,
        template: input.template,
        body_enc: toPgBytea(bodyEnc),
        key_version: keyVersion,
        created_by: userId,
      })
      .select('id,updated_at')
      .single();
    if (error || !data) {
      return { ok: false, error: error?.code === '23505' ? 'Esa sesion ya tiene una nota.' : 'No se pudo guardar la nota.' };
    }
    return { ok: true, noteId: data.id as string, updatedAt: data.updated_at as string };
  }

  const { data: current } = await supabase
    .from('session_notes')
    .select('body_enc,key_version,updated_at')
    .eq('id', input.noteId)
    .eq('patient_id', input.patientId)
    .maybeSingle();
  if (!current) return { ok: false, error: 'La nota no existe.' };
  if (input.expectedUpdatedAt && current.updated_at !== input.expectedUpdatedAt) {
    return { ok: false, error: 'La nota cambio en otra pestana. Recarga antes de guardar.', conflict: true };
  }

  const { error: vErr } = await supabase.from('session_note_versions').insert({
    note_id: input.noteId,
    body_enc: current.body_enc as string,
    key_version: current.key_version as number,
    saved_by: userId,
  });
  if (vErr) return { ok: false, error: 'No se pudo versionar la nota.' };

  let q = supabase
    .from('session_notes')
    .update({ template: input.template, body_enc: toPgBytea(bodyEnc), key_version: keyVersion })
    .eq('id', input.noteId)
    .eq('patient_id', input.patientId);
  if (input.expectedUpdatedAt) q = q.eq('updated_at', input.expectedUpdatedAt);
  const { data, error } = await q.select('updated_at').maybeSingle();
  if (error || !data) return { ok: false, error: 'No se pudo guardar la nota (posible conflicto).', conflict: true };
  return { ok: true, noteId: input.noteId, updatedAt: data.updated_at as string };
}
