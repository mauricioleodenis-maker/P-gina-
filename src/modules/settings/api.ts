import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/modules/auth/api';
import type {
  AuditLogRow,
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  PracticeSettingsRow,
  ServiceRow,
} from './types';

/** Fila unica de ajustes de la consulta (RLS: solo admin aal2). Lo consumen P5, P7 y P8. */
export async function getPracticeSettings(): Promise<PracticeSettingsRow> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('practice_settings').select('*').eq('id', true).single();
  if (error || !data) throw new Error('No se pudieron leer los ajustes de la consulta');
  return data;
}

export async function listServices(): Promise<ServiceRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('services').select('*').order('sort_order').order('name');
  if (error) throw new Error('No se pudieron leer los servicios');
  return data ?? [];
}

export async function listAvailabilityRules(): Promise<AvailabilityRuleRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('availability_rules').select('*').order('weekday').order('start_time');
  if (error) throw new Error('No se pudo leer el horario');
  return data ?? [];
}

export async function listAvailabilityExceptions(): Promise<AvailabilityExceptionRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('availability_exceptions').select('*').order('starts_on', { ascending: false });
  if (error) throw new Error('No se pudieron leer los bloqueos');
  return data ?? [];
}

export type AuditFilter = { action?: string; table?: string; page?: number; pageSize?: number };

export async function listAuditLog(f: AuditFilter = {}): Promise<{ rows: AuditLogRow[]; total: number }> {
  await requireAdmin();
  const supabase = await createClient();
  const size = Math.min(f.pageSize ?? 50, 200);
  const from = Math.max(f.page ?? 0, 0) * size;
  let q = supabase.from('audit_log').select('*', { count: 'exact' }).order('at', { ascending: false }).range(from, from + size - 1);
  if (f.action) q = q.eq('action', f.action);
  if (f.table) q = q.eq('table_name', f.table);
  const { data, count, error } = await q;
  if (error) throw new Error('No se pudo leer la auditoria');
  return { rows: data ?? [], total: count ?? 0 };
}
