'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/modules/auth/api';
import type { ActionResult } from '@/modules/auth/types';
import * as svc from './service';
import { AppointmentError } from './types';

const uuid = z.string().uuid();
const iso = z.string().datetime({ offset: true });
const scope = z.enum(['one', 'following', 'all']).default('one');
const note = z.string().trim().max(500).nullable().optional();

const createSchema = z.object({
  patientId: uuid,
  serviceId: uuid,
  startsAt: iso,
  durationMin: z.number().int().min(15).max(240).optional(),
  modality: z.enum(['in_person', 'online']).optional(),
  status: z.enum(['scheduled', 'confirmed']).optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  internalNote: note,
  meetingUrl: z.string().trim().url().max(300).nullable().optional(),
  recurrence: z
    .object({ frequency: z.enum(['weekly', 'biweekly', 'monthly']), count: z.number().int().min(2).max(104).optional(), until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })
    .refine((r) => r.count || r.until, 'Indica cuántas sesiones o hasta cuándo')
    .optional(),
});

const patchSchema = z.object({
  startsAt: iso.optional(),
  durationMin: z.number().int().min(15).max(240).optional(),
  modality: z.enum(['in_person', 'online']).optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'no_show']).optional(),
  priceCents: z.number().int().min(0).nullable().optional(),
  internalNote: note,
  meetingUrl: z.string().trim().url().max(300).nullable().optional(),
  serviceId: uuid.optional(),
});

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  await requireAdmin();
  try {
    const data = await fn();
    revalidatePath('/admin/calendario');
    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin');
    return { ok: true, data };
  } catch (e) {
    if (e instanceof AppointmentError) return { ok: false, error: e.message, fieldErrors: e.code === 'overlap' ? { startsAt: e.message } : undefined };
    console.error('appointment action failed');
    return { ok: false, error: 'No se pudo completar la acción. Inténtalo de nuevo.' };
  }
}
const bad = (error = 'Datos no válidos'): ActionResult<never> => ({ ok: false, error });

export async function createAppointmentAction(input: unknown) {
  const p = createSchema.safeParse(input);
  if (!p.success) return bad(p.error.issues[0]?.message);
  return run(() => svc.createAppointment(p.data));
}

export async function updateAppointmentAction(id: string, patch: unknown, sc: unknown) {
  const p = patchSchema.safeParse(patch);
  if (!uuid.safeParse(id).success || !p.success) return bad();
  return run(() => svc.updateAppointment(id, p.data, scope.parse(sc)));
}

export async function moveAppointmentAction(id: string, startsAt: string, endsAt: string) {
  if (!uuid.safeParse(id).success || !iso.safeParse(startsAt).success || !iso.safeParse(endsAt).success) return bad();
  return run(() => svc.moveAppointment(id, startsAt, endsAt));
}

export async function cancelAppointmentAction(id: string, sc: unknown, reason?: string) {
  if (!uuid.safeParse(id).success) return bad();
  return run(() => svc.cancelAppointment(id, scope.parse(sc), reason));
}

export async function markCompletedAction(id: string) {
  if (!uuid.safeParse(id).success) return bad();
  return run(() => svc.markCompleted(id));
}

export async function acceptRequestAction(id: string) {
  if (!uuid.safeParse(id).success) return bad();
  return run(() => svc.acceptRequest(id));
}

export async function rejectRequestAction(id: string, reason?: string) {
  if (!uuid.safeParse(id).success) return bad();
  return run(() => svc.rejectRequest(id, reason));
}
