import 'server-only';
import { createHash } from 'node:crypto';

/** k-anonymity con Have I Been Pwned: solo se envian 5 caracteres del SHA-1. Falla en abierto. */
export async function isPwnedPassword(password: string): Promise<boolean> {
  try {
    const sha = createHash('sha1').update(password).digest('hex').toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${sha.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const text = await res.text();
    const suffix = sha.slice(5);
    return text.split('\n').some((l) => {
      const [s, n] = l.trim().split(':');
      return s === suffix && Number(n) > 0;
    });
  } catch {
    return false;
  }
}
