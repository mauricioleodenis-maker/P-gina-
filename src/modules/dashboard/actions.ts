'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/modules/auth/api';
import { logAudit } from '@/lib/audit';
import { db } from './db';

export type ActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.string().uuid();
const requestSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['in_progress', 'resolved', 'rejected']),
  resolution: z.string().trim().max(2000).optional(),
});

export async function setMessageHandledAction(id: string, handled: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(id).success) return { ok: false, error: 'Mensaje no valido.' };
  const sb = await db();
  const { error } = await sb.from('contact_messages').update({ handled }).eq('id', id);
  if (error) return { ok: false, error: 'No se pudo actualizar el mensaje.' };
  await logAudit({ action: 'update_contact_message', table: 'contact_messages', rowId: id, meta: { handled } });
  revalidatePath('/admin/mensajes');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateDataRequestStatusAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos no validos.' };
  const { id, status, resolution } = parsed.data;
  const sb = await db();
  const { error } = await sb
    .from('data_requests')
    .update({ status, resolution: resolution || null, resolved_at: status === 'in_progress' ? null : new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: 'No se pudo actualizar la solicitud.' };
  await logAudit({ action: 'update_data_request', table: 'data_requests', rowId: id, meta: { status } });
  revalidatePath('/admin/mensajes');
  revalidatePath('/admin');
  return { ok: true };
}
