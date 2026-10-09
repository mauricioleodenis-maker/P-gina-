import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe tu nombre.').max(120),
  email: z.string().trim().email('Revisa el correo electrónico.').max(254),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Escribe un mensaje.').max(2000, 'El mensaje es demasiado largo.'),
  consent: z.literal(true, { message: 'Necesito tu aceptación para poder responderte.' }),
  website: z.string().optional(), // honeypot
  turnstileToken: z.string().optional(),
});

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(ip, { limit: 5, windowSeconds: 600, prefix: 'contact' }))) {
    return NextResponse.json({ ok: false, error: 'Demasiados intentos. Prueba de nuevo en unos minutos.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud no válida.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? 'form');
      errors[k] ??= issue.message;
    }
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot: respuesta de exito simulada, sin guardar nada.
  if (data.website) return NextResponse.json({ ok: true });

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: 'No hemos podido verificar que eres una persona. Inténtalo de nuevo.' }, { status: 400 });
  }

  const sb = createAdminClient();
  const row = { name: data.name, email: data.email, phone: data.phone || null, message: data.message, consent: true };
  // Cast temporal: los tipos de database.ts (P2) resuelven Insert a never[]; ver handoffs/p4.md.
  const { error } = await sb.from('contact_messages').insert(row as never);
  if (error) {
    // Nunca registrar el contenido del mensaje.
    console.error('contact insert failed', error.code);
    return NextResponse.json({ ok: false, error: 'No se pudo enviar. Inténtalo de nuevo en unos minutos.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
