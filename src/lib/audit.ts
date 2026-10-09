import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type AuditInput = {
  action: string;
  table: string;
  rowId?: string | null;
  meta?: Record<string, unknown>;
};

/** Registra en audit_log. Nunca incluir contenido clinico en meta. Columnas finales: P2. */
export async function logAudit({ action, table, rowId, meta }: AuditInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (v: unknown) => Promise<{ error: { message: string } | null }> };
  })
    .from('audit_log')
    .insert({ action, table_name: table, row_id: rowId ?? null, meta: meta ?? {} });
  if (error) console.error('audit_log insert failed', error.message);
}
