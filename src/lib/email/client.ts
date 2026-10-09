import 'server-only';
import { Resend } from 'resend';

let client: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY no configurada');
  return (client ??= new Resend(key));
}

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Caromafla <no-reply@caromafla.online>';
