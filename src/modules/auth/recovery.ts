import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Codigos de recuperacion MFA. Supabase no los ofrece de serie; se guardan como HMAC en
 * `app_metadata.mfa_recovery` (solo escribible con service_role). Alternativa limpia: tabla
 * dedicada (ver docs/plan/handoffs/P3.md).
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford, sin I L O U
export const RECOVERY_COUNT = 10;

function hmac(code: string): string {
  const key = process.env.CLINICAL_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createHmac('sha256', `mfa-recovery:${key}`).update(normalize(code)).digest('hex');
}

export function normalize(code: string): string {
  return code.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

export function generateCodes(count = RECOVERY_COUNT): string[] {
  return Array.from({ length: count }, () => {
    const b = randomBytes(10);
    const chars = Array.from(b, (x) => ALPHABET[x % 32]).join('');
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

/** Reemplaza todos los codigos del usuario y devuelve los nuevos en claro (mostrar una sola vez). */
export async function issueRecoveryCodes(userId: string): Promise<string[]> {
  const codes = generateCodes();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { mfa_recovery: codes.map(hmac) },
  });
  if (error) throw new Error('No se pudieron guardar los codigos de recuperacion');
  return codes;
}

export async function remainingRecoveryCodes(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const list = (data.user?.app_metadata as { mfa_recovery?: string[] } | undefined)?.mfa_recovery;
  return Array.isArray(list) ? list.length : 0;
}

/** Consume un codigo valido (un solo uso). */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const list = (data.user?.app_metadata as { mfa_recovery?: string[] } | undefined)?.mfa_recovery ?? [];
  const h = Buffer.from(hmac(code));
  const idx = list.findIndex((x) => {
    const b = Buffer.from(x);
    return b.length === h.length && timingSafeEqual(b, h);
  });
  if (idx < 0) return false;
  const next = list.filter((_, i) => i !== idx);
  const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: { mfa_recovery: next } });
  return !error;
}

/** Borra los factores TOTP para forzar un nuevo alta tras usar un codigo. */
export async function resetTotpFactors(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.mfa.listFactors({ userId });
  for (const f of data?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  }
}
