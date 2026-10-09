import 'server-only';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/**
 * Cifrado de notas clinicas (C8/C9). AES-256-GCM en la aplicacion; la BD solo ve bytes.
 *  - Clave maestra: CLINICAL_ENCRYPTION_KEY (32 B en base64) + CLINICAL_KEY_VERSION (version vigente).
 *  - Claves anteriores (solo descifrar durante la rotacion): CLINICAL_ENCRYPTION_KEY_V<n>.
 *  - Clave por paciente: HKDF-SHA256(master, salt = "caromafla/clinical/v<n>", info = "patient:<id>").
 *  - AAD = patientId: un blob copiado a otro paciente no descifra.
 *  - Formato bytea: nonce(12) || ciphertext || tag(16). Ver docs/plan/crypto.md.
 * NUNCA registrar plaintext, claves ni bodyEnc en logs.
 */

export type CryptoEnv = Record<string, string | undefined>;

const NONCE_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

export interface CryptoCtx {
  patientId: string;
}
export interface EncryptedNote {
  bodyEnc: Buffer;
  keyVersion: number;
}

export class CryptoConfigError extends Error {}
export class DecryptError extends Error {
  constructor() {
    super('No se pudo descifrar la nota (clave, version o paciente incorrectos, o datos alterados).');
  }
}

function parseKey(b64: string | undefined, name: string): Buffer {
  const key = Buffer.from((b64 ?? '').trim(), 'base64');
  if (key.length !== KEY_LEN) {
    throw new CryptoConfigError(`${name} debe ser 32 bytes en base64 (openssl rand -base64 32).`);
  }
  return key;
}

/** Version vigente para cifrar. */
export function currentKeyVersion(env: CryptoEnv = process.env): number {
  const v = Number(env.CLINICAL_KEY_VERSION ?? 1);
  if (!Number.isInteger(v) || v < 1 || v > 32767) throw new CryptoConfigError('CLINICAL_KEY_VERSION invalida.');
  return v;
}

function masterKeyFor(version: number, env: CryptoEnv): Buffer {
  if (version === currentKeyVersion(env)) return parseKey(env.CLINICAL_ENCRYPTION_KEY, 'CLINICAL_ENCRYPTION_KEY');
  const legacy = env[`CLINICAL_ENCRYPTION_KEY_V${version}`];
  if (!legacy) throw new CryptoConfigError(`Falta CLINICAL_ENCRYPTION_KEY_V${version} para descifrar key_version=${version}.`);
  return parseKey(legacy, `CLINICAL_ENCRYPTION_KEY_V${version}`);
}

function patientKey(version: number, patientId: string, env: CryptoEnv): Buffer {
  if (!patientId) throw new CryptoConfigError('patientId requerido.');
  const master = masterKeyFor(version, env);
  return Buffer.from(hkdfSync('sha256', master, `caromafla/clinical/v${version}`, `patient:${patientId}`, KEY_LEN));
}

export function encryptNote(
  plain: string,
  ctx: CryptoCtx,
  env: CryptoEnv = process.env,
): EncryptedNote {
  const keyVersion = currentKeyVersion(env);
  const key = patientKey(keyVersion, ctx.patientId, env);
  const nonce = randomBytes(NONCE_LEN);
  const cipher = createCipheriv('aes-256-gcm', key, nonce, { authTagLength: TAG_LEN });
  cipher.setAAD(Buffer.from(ctx.patientId, 'utf8'));
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { bodyEnc: Buffer.concat([nonce, ct, cipher.getAuthTag()]), keyVersion };
}

export function decryptNote(
  bodyEnc: Buffer | Uint8Array | string,
  keyVersion: number,
  ctx: CryptoCtx,
  env: CryptoEnv = process.env,
): string {
  const buf = typeof bodyEnc === 'string' ? fromPgBytea(bodyEnc) : Buffer.from(bodyEnc);
  if (buf.length < NONCE_LEN + TAG_LEN) throw new DecryptError();
  try {
    const key = patientKey(keyVersion, ctx.patientId, env);
    const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, NONCE_LEN), { authTagLength: TAG_LEN });
    decipher.setAAD(Buffer.from(ctx.patientId, 'utf8'));
    decipher.setAuthTag(buf.subarray(buf.length - TAG_LEN));
    return Buffer.concat([decipher.update(buf.subarray(NONCE_LEN, buf.length - TAG_LEN)), decipher.final()]).toString('utf8');
  } catch (e) {
    if (e instanceof CryptoConfigError) throw e;
    throw new DecryptError();
  }
}

/** Re-cifra con la version vigente (rotacion). Devuelve null si ya esta en la vigente. */
export function reencryptNote(
  bodyEnc: Buffer | Uint8Array | string,
  keyVersion: number,
  ctx: CryptoCtx,
  env: CryptoEnv = process.env,
): EncryptedNote | null {
  if (keyVersion === currentKeyVersion(env)) return null;
  return encryptNote(decryptNote(bodyEnc, keyVersion, ctx, env), ctx, env);
}

/** Buffer -> literal bytea de PostgREST ("\\x<hex>") para insertar/actualizar. */
export function toPgBytea(buf: Buffer | Uint8Array): string {
  return '\\x' + Buffer.from(buf).toString('hex');
}

/** bytea devuelto por PostgREST ("\\x<hex>") -> Buffer. */
export function fromPgBytea(value: string): Buffer {
  if (!/^\\x([0-9a-fA-F]{2})*$/.test(value)) throw new DecryptError();
  return Buffer.from(value.slice(2), 'hex');
}
