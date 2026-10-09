'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { logAudit } from '@/lib/audit';
import { requireAdmin } from './api';
import { isPwnedPassword } from './hibp';
import { changePasswordSchema, loginSchema, recoverySchema, totpSchema } from './schemas';
import { consumeRecoveryCode, issueRecoveryCodes, resetTotpFactors } from './recovery';
import { safeNext } from './redirect';
import { IDLE_COOKIE, type ActionResult, type FormState } from './types';

const FAILS_COOKIE = 'cm_fails';
const CAPTCHA_AFTER = 3;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

function flatten(err: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0] ?? 'form')] ??= i.message;
  return out;
}

const cookieBase = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { ok: false, error: 'Revisa los campos', fieldErrors: flatten(parsed.error) };

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`login:ip:${ip}`, { limit: 10, windowSeconds: 900, prefix: 'login-ip' })) &&
    (await rateLimit(`login:em:${parsed.data.email}`, { limit: 8, windowSeconds: 900, prefix: 'login-em' }));
  if (!allowed) return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' };

  const jar = await cookies();
  const fails = Number(jar.get(FAILS_COOKIE)?.value ?? 0) || 0;
  if (fails >= CAPTCHA_AFTER) {
    const token = formData.get('cf-turnstile-response');
    if (!(await verifyTurnstile(typeof token === 'string' ? token : null, ip))) {
      return { ok: false, needsCaptcha: true, error: 'Completa la verificacion antes de continuar.' };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    jar.set(FAILS_COOKIE, String(fails + 1), { ...cookieBase, maxAge: 900 });
    return { ok: false, needsCaptcha: fails + 1 >= CAPTCHA_AFTER, error: 'Correo o contrasena incorrectos.' };
  }
  jar.delete(FAILS_COOKIE);
  jar.set(IDLE_COOKIE, String(Date.now()), { ...cookieBase });
  redirect(safeNext(String(formData.get('next') ?? '')));
}

export async function verifyMfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = totpSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { ok: false, error: 'Codigo no valido', fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/login');
  if (!(await rateLimit(`mfa:${u.user.id}`, { limit: 8, windowSeconds: 600, prefix: 'mfa' }))) {
    return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = factors?.totp?.[0];
  if (!totp) redirect('/login/mfa/enrol');
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: parsed.data.code });
  if (error) return { ok: false, error: 'Codigo incorrecto o caducado.' };

  await logAudit({ action: 'login', table: 'auth', rowId: u.user.id });
  redirect(safeNext(String(formData.get('next') ?? '')));
}

/** Acceso con codigo de recuperacion: consume el codigo, resetea TOTP y obliga a un nuevo alta. */
export async function recoveryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = recoverySchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { ok: false, error: 'Formato no valido', fieldErrors: flatten(parsed.error) };
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/login');
  if (!(await rateLimit(`rec:${u.user.id}`, { limit: 5, windowSeconds: 900, prefix: 'rec' }))) {
    return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }
  if (!(await consumeRecoveryCode(u.user.id, parsed.data.code))) {
    return { ok: false, error: 'Codigo de recuperacion no valido.' };
  }
  await resetTotpFactors(u.user.id);
  redirect('/login/mfa/enrol?recovered=1');
}

export type EnrolStart = { factorId: string; qr: string; secret: string };

export async function startEnrolAction(): Promise<ActionResult<EnrolStart>> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Sesion caducada' };
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp?.length) return { ok: false, error: 'Ya tienes un segundo factor activo.' };
  // Limpia altas a medias (factores sin verificar).
  for (const f of factors?.all ?? []) {
    if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Caromafla ${Date.now()}` });
  if (error || !data) return { ok: false, error: 'No se pudo iniciar el alta del segundo factor.' };
  return { ok: true, data: { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret } };
}

export async function confirmEnrolAction(factorId: string, code: string): Promise<ActionResult<{ codes: string[] }>> {
  const parsed = totpSchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: 'El codigo tiene 6 digitos', fieldErrors: flatten(parsed.error) };
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Sesion caducada' };
  if (!(await rateLimit(`mfa:${u.user.id}`, { limit: 8, windowSeconds: 600, prefix: 'mfa' }))) {
    return { ok: false, error: 'Demasiados intentos. Espera unos minutos.' };
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: parsed.data.code });
  if (error) return { ok: false, error: 'Codigo incorrecto. Comprueba la hora del movil e intentalo de nuevo.' };
  const codes = await issueRecoveryCodes(u.user.id);
  await logAudit({ action: 'mfa_enrol', table: 'auth', rowId: u.user.id });
  return { ok: true, data: { codes } };
}

export async function regenerateRecoveryCodesAction(): Promise<ActionResult<{ codes: string[] }>> {
  const { userId } = await requireAdmin();
  const codes = await issueRecoveryCodes(userId);
  await logAudit({ action: 'recovery_codes_regenerated', table: 'auth', rowId: userId });
  return { ok: true, data: { codes } };
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await requireAdmin();
  const parsed = changePasswordSchema.safeParse({ password: formData.get('password'), confirm: formData.get('confirm') });
  if (!parsed.success) return { ok: false, error: 'Revisa los campos', fieldErrors: flatten(parsed.error) };
  if (await isPwnedPassword(parsed.data.password)) {
    return { ok: false, error: 'Esa contrasena aparece en filtraciones conocidas. Elige otra.', fieldErrors: { password: 'Contrasena comprometida' } };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: 'No se pudo cambiar la contrasena.' };
  await logAudit({ action: 'password_changed', table: 'auth', rowId: userId });
  return { ok: true };
}

export async function signOutAction(reason?: string): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(IDLE_COOKIE);
  redirect(reason === 'timeout' ? '/login?error=timeout' : '/login');
}

export async function signOutOtherSessionsAction(): Promise<ActionResult> {
  const { userId } = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) return { ok: false, error: 'No se pudieron cerrar las otras sesiones.' };
  await logAudit({ action: 'sessions_revoked', table: 'auth', rowId: userId });
  return { ok: true };
}
