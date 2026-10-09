'use server';
import { revalidatePath } from 'next/cache';
import { cancelByToken } from '@/modules/booking/service';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/** Cancela una cita con el token del correo (hasta `cancellation_hours` antes). */
export async function cancelBookingAction(token: string): Promise<{ ok: boolean; message: string }> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await rateLimit(ip, { limit: 10, windowSeconds: 600, prefix: 'cancel' }))) {
    return { ok: false, message: 'Demasiados intentos. Prueba de nuevo en unos minutos.' };
  }
  const res = await cancelByToken(token);
  if (res.ok) revalidatePath(`/reservar/confirmacion/${token}`);
  return res;
}
