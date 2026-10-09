import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { bookingSchema, flattenIssues } from '@/modules/booking/schema';
import { bookingMessage, submitBooking } from '@/modules/booking/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS = { validation: 400, rate_limited: 429, captcha: 400, slot_taken: 409, too_soon: 409, too_far: 409, invalid_service: 409, server: 500 } as const;

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Reserva publica: zod + honeypot + Turnstile + rate limit -> RPC request_appointment. Nunca registra datos personales. */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateLimit(ip, { limit: 5, windowSeconds: 600, prefix: 'booking-ip' }))) {
    return NextResponse.json({ ok: false, code: 'rate_limited', message: bookingMessage('rate_limited') }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'validation', message: 'Solicitud no válida.' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: 'validation', message: bookingMessage('validation'), errors: flattenIssues(parsed.error.issues) },
      { status: 400 },
    );
  }

  // Honeypot: exito simulado, no se guarda nada.
  if (parsed.data.website) return NextResponse.json({ ok: true, token: 'x'.repeat(43), startsAt: parsed.data.startsAt });

  // Limite adicional por correo (evita inundar a una misma persona).
  if (!(await rateLimit(parsed.data.email.toLowerCase(), { limit: 3, windowSeconds: 3600, prefix: 'booking-email' }))) {
    return NextResponse.json({ ok: false, code: 'rate_limited', message: bookingMessage('rate_limited') }, { status: 429 });
  }
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, code: 'captcha', message: bookingMessage('captcha') }, { status: 400 });
  }

  const result = await submitBooking(parsed.data, { ip });
  if (result.ok) return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json(result, { status: STATUS[result.code], headers: { 'Cache-Control': 'no-store' } });
}
