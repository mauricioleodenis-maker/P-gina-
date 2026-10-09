'use server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export type RightsState = {
  ok: boolean;
  errors?: Partial<Record<'name' | 'email' | 'type' | 'consent', string>>;
  formError?: string;
};

const TYPES = ['access', 'rectification', 'erasure', 'objection', 'restriction', 'portability', 'withdrawal'] as const;

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe tu nombre.').max(120),
  email: z.string().trim().email('Revisa el correo electrónico.').max(254),
  type: z.enum(TYPES, { message: 'Elige un derecho.' }),
  consent: z.literal('on', { message: 'Necesito tu aceptación para tramitar la solicitud.' }),
});

/** Inserta en data_requests con service_role (no hay politica anon). Nunca registra el contenido. */
export async function submitDataRequest(_prev: RightsState, fd: FormData): Promise<RightsState> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!(await rateLimit(ip, { limit: 3, windowSeconds: 3600, prefix: 'rights' }))) {
    return { ok: false, formError: 'Demasiados intentos. Prueba de nuevo más tarde.' };
  }
  // Honeypot: exito simulado.
  if (String(fd.get('website') ?? '')) return { ok: true };

  const parsed = schema.safeParse({
    name: fd.get('name'),
    email: fd.get('email'),
    type: fd.get('type'),
    consent: fd.get('consent'),
  });
  if (!parsed.success) {
    const errors: NonNullable<RightsState['errors']> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof NonNullable<RightsState['errors']>;
      errors[k] ??= issue.message;
    }
    return { ok: false, errors };
  }

  if (!(await verifyTurnstile(String(fd.get('cf-turnstile-response') ?? ''), ip))) {
    return { ok: false, formError: 'No hemos podido verificar que eres una persona. Inténtalo de nuevo.' };
  }

  const d = parsed.data;
  const sb = createAdminClient();
  // Cast temporal igual que /api/contact (tipos de database.ts); ver handoffs/P10.md.
  const { error } = await sb
    .from('data_requests')
    .insert({ requester_name: d.name, requester_email: d.email, type: d.type } as never);
  if (error) {
    console.error('data_request insert failed', error.code);
    return { ok: false, formError: 'No se pudo enviar. Escríbeme por correo e inténtalo más tarde.' };
  }
  return { ok: true };
}
