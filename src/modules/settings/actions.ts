'use server';
import { revalidatePath } from 'next/cache';
import type { ZodType } from 'zod';
import { logAudit } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/api';
import type { ActionResult, FormState } from '@/modules/auth/types';
import { exceptionSchema, fiscalSchema, policySchema, scheduleSchema, serviceSchema } from './schemas';

const ERR = 'No se pudo guardar. Intentalo de nuevo.';

function parse<T>(schema: ZodType<T>, input: unknown): { data: T } | { state: FormState } {
  const r = schema.safeParse(input);
  if (r.success) return { data: r.data };
  const fieldErrors: Record<string, string> = {};
  for (const i of r.error.issues) fieldErrors[String(i.path[0] ?? 'form')] ??= i.message;
  return { state: { ok: false, error: 'Revisa los campos marcados', fieldErrors } };
}

export async function updateFiscalAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parse(fiscalSchema, Object.fromEntries(fd));
  if ('state' in r) return r.state;
  const supabase = await createClient();
  const { error } = await supabase.from('practice_settings').update(r.data).eq('id', true);
  if (error) return { ok: false, error: ERR };
  await logAudit({ action: 'update', table: 'practice_settings', meta: { section: 'fiscal' } });
  revalidatePath('/admin/ajustes/perfil');
  return { ok: true };
}

export async function updatePolicyAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parse(policySchema, Object.fromEntries(fd));
  if ('state' in r) return r.state;
  const supabase = await createClient();
  const { error } = await supabase.from('practice_settings').update(r.data).eq('id', true);
  if (error) return { ok: false, error: ERR };
  await logAudit({ action: 'update', table: 'practice_settings', meta: { section: 'policy' } });
  revalidatePath('/admin/ajustes/reservas');
  return { ok: true };
}

export async function saveServiceAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parse(serviceSchema, Object.fromEntries(fd));
  if ('state' in r) return r.state;
  const { id, price_eur, ...rest } = r.data;
  const row = { ...rest, price_cents: Math.round(price_eur * 100) };
  const supabase = await createClient();
  const res = id
    ? await supabase.from('services').update(row).eq('id', id).select('id').single()
    : await supabase.from('services').insert(row).select('id').single();
  if (res.error) {
    return res.error.code === '23505'
      ? { ok: false, error: 'Ya existe un servicio con ese identificador (slug).', fieldErrors: { slug: 'Ya existe' } }
      : { ok: false, error: ERR };
  }
  await logAudit({ action: id ? 'update' : 'insert', table: 'services', rowId: res.data.id });
  revalidatePath('/admin/ajustes/servicios');
  revalidatePath('/servicios');
  revalidatePath('/tarifas');
  return { ok: true };
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) {
    return { ok: false, error: error.code === '23503' ? 'Tiene citas asociadas: desactivalo en lugar de borrarlo.' : ERR };
  }
  await logAudit({ action: 'delete', table: 'services', rowId: id });
  revalidatePath('/admin/ajustes/servicios');
  revalidatePath('/servicios');
  revalidatePath('/tarifas');
  return { ok: true };
}

/** Sustituye el horario semanal: inserta lo nuevo y solo despues borra lo anterior (no se pierde nada si falla). */
export async function saveScheduleAction(rulesJson: string): Promise<ActionResult> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(rulesJson);
  } catch {
    return { ok: false, error: 'Datos no validos' };
  }
  const r = parse(scheduleSchema, raw);
  if ('state' in r) return { ok: false, error: r.state.fieldErrors?.form ?? 'Revisa las franjas: fin posterior al inicio y sin solapes.' };
  const supabase = await createClient();
  const { data: old } = await supabase.from('availability_rules').select('id');
  if (r.data.length) {
    const { error } = await supabase.from('availability_rules').insert(r.data);
    if (error) return { ok: false, error: ERR };
  }
  const oldIds = (old ?? []).map((x) => x.id);
  if (oldIds.length) {
    const { error } = await supabase.from('availability_rules').delete().in('id', oldIds);
    if (error) return { ok: false, error: ERR };
  }
  await logAudit({ action: 'update', table: 'availability_rules', meta: { count: r.data.length } });
  revalidatePath('/admin/ajustes/horario');
  return { ok: true };
}

export async function addExceptionAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const r = parse(exceptionSchema, Object.fromEntries(fd));
  if ('state' in r) return r.state;
  const supabase = await createClient();
  const row = r.data.is_closed ? { ...r.data, start_time: null, end_time: null } : r.data;
  const { data, error } = await supabase.from('availability_exceptions').insert(row).select('id').single();
  if (error) return { ok: false, error: ERR };
  await logAudit({ action: 'insert', table: 'availability_exceptions', rowId: data.id });
  revalidatePath('/admin/ajustes/bloqueos');
  return { ok: true };
}

export async function deleteExceptionAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('availability_exceptions').delete().eq('id', id);
  if (error) return { ok: false, error: ERR };
  await logAudit({ action: 'delete', table: 'availability_exceptions', rowId: id });
  revalidatePath('/admin/ajustes/bloqueos');
  return { ok: true };
}

/**
 * Exportacion de datos no clinicos (RGPD / copia). Las notas de sesion NO se incluyen:
 * se exportan por paciente desde su ficha (P6) tras descifrarlas.
 */
export async function exportPracticeDataAction(): Promise<ActionResult<{ filename: string; json: string }>> {
  const { userId } = await requireAdmin();
  const supabase = await createClient();
  const tables = [
    'practice_settings', 'services', 'availability_rules', 'availability_exceptions',
    'patients', 'appointments', 'payments', 'invoices', 'consents', 'data_requests',
  ] as const;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), format: 'caromafla-export-v1' };
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) return { ok: false, error: `No se pudo exportar ${t}` };
    out[t] = data;
  }
  await logAudit({ action: 'export', table: 'all', rowId: userId, meta: { tables: tables.length } });
  const stamp = new Date().toISOString().slice(0, 10);
  return { ok: true, data: { filename: `caromafla-export-${stamp}.json`, json: JSON.stringify(out, null, 2) } };
}
