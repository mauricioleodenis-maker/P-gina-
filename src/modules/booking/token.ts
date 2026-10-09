import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Token opaco de 256 bits para cancelar/reprogramar. En BD solo se guarda su hash (FR-006). */
export function generateManageToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** IP -> hash con sal (no reversible razonablemente; no se guarda la IP). */
export function hashIp(ip: string): string {
  const salt = process.env.CRON_SECRET ?? 'dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}
