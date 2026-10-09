// @vitest-environment node
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  CryptoConfigError, DecryptError, currentKeyVersion, decryptNote, encryptNote,
  fromPgBytea, reencryptNote, toPgBytea,
} from '../index';

const k = () => randomBytes(32).toString('base64');
const env = (extra: Record<string, string> = {}): Record<string, string | undefined> =>
  ({ CLINICAL_ENCRYPTION_KEY: k(), CLINICAL_KEY_VERSION: '1', ...extra });
const P1 = '00000000-0000-4000-8000-000000000001';
const P2 = '00000000-0000-4000-8000-000000000002';

describe('crypto notas clinicas', () => {
  it('ida y vuelta con unicode', () => {
    const e = env(); const txt = 'Sesion 3: ansiedad, "comillas" ñandú 🌿';
    const enc = encryptNote(txt, { patientId: P1 }, e);
    expect(enc.keyVersion).toBe(1);
    expect(decryptNote(enc.bodyEnc, enc.keyVersion, { patientId: P1 }, e)).toBe(txt);
  });
  it('formato nonce(12)||ct||tag(16) y nonce distinto en cada cifrado', () => {
    const e = env(); const a = encryptNote('hola', { patientId: P1 }, e); const b = encryptNote('hola', { patientId: P1 }, e);
    expect(a.bodyEnc.length).toBe(12 + 4 + 16);
    expect(a.bodyEnc.equals(b.bodyEnc)).toBe(false);
    expect(a.bodyEnc.includes(Buffer.from('hola'))).toBe(false);
  });
  it('cadena vacia', () => {
    const e = env(); const enc = encryptNote('', { patientId: P1 }, e);
    expect(decryptNote(enc.bodyEnc, 1, { patientId: P1 }, e)).toBe('');
  });
  it('AAD/clave por paciente: otro paciente no descifra', () => {
    const e = env(); const enc = encryptNote('secreto', { patientId: P1 }, e);
    expect(() => decryptNote(enc.bodyEnc, 1, { patientId: P2 }, e)).toThrow(DecryptError);
  });
  it('detecta manipulacion', () => {
    const e = env(); const enc = encryptNote('secreto', { patientId: P1 }, e);
    for (const i of [0, 13, enc.bodyEnc.length - 1]) {
      const bad = Buffer.from(enc.bodyEnc); bad[i] = (bad[i] ?? 0) ^ 1;
      expect(() => decryptNote(bad, 1, { patientId: P1 }, e)).toThrow(DecryptError);
    }
    expect(() => decryptNote(Buffer.alloc(5), 1, { patientId: P1 }, e)).toThrow(DecryptError);
  });
  it('clave incorrecta falla', () => {
    const enc = encryptNote('x', { patientId: P1 }, env());
    expect(() => decryptNote(enc.bodyEnc, 1, { patientId: P1 }, env())).toThrow(DecryptError);
  });
  it('configuracion invalida', () => {
    expect(() => encryptNote('x', { patientId: P1 }, { CLINICAL_ENCRYPTION_KEY: 'corta' })).toThrow(CryptoConfigError);
    expect(() => encryptNote('x', { patientId: '' }, env())).toThrow(CryptoConfigError);
    expect(() => currentKeyVersion({ CLINICAL_KEY_VERSION: '0' })).toThrow(CryptoConfigError);
  });
  it('rotacion: v1 descifra con CLINICAL_ENCRYPTION_KEY_V1 y se re-cifra a v2', () => {
    const k1 = k(); const e1 = env({ CLINICAL_ENCRYPTION_KEY: k1 });
    const old = encryptNote('nota vieja', { patientId: P1 }, e1);
    const k2 = k();
    const e2 = { CLINICAL_ENCRYPTION_KEY: k2, CLINICAL_KEY_VERSION: '2', CLINICAL_ENCRYPTION_KEY_V1: k1 };
    expect(decryptNote(old.bodyEnc, 1, { patientId: P1 }, e2)).toBe('nota vieja');
    const re = reencryptNote(old.bodyEnc, 1, { patientId: P1 }, e2)!;
    expect(re.keyVersion).toBe(2);
    expect(decryptNote(re.bodyEnc, 2, { patientId: P1 }, e2)).toBe('nota vieja');
    expect(reencryptNote(re.bodyEnc, 2, { patientId: P1 }, e2)).toBeNull();
    // sin la clave antigua no se puede
    expect(() => decryptNote(old.bodyEnc, 1, { patientId: P1 }, { ...e2, CLINICAL_ENCRYPTION_KEY_V1: undefined })).toThrow(CryptoConfigError);
  });
  it('bytea hex de PostgREST', () => {
    const e = env(); const enc = encryptNote('hex', { patientId: P1 }, e);
    const hex = toPgBytea(enc.bodyEnc);
    expect(hex.startsWith('\\x')).toBe(true);
    expect(fromPgBytea(hex).equals(enc.bodyEnc)).toBe(true);
    expect(decryptNote(hex, 1, { patientId: P1 }, e)).toBe('hex');
    expect(() => fromPgBytea('zz')).toThrow(DecryptError);
  });
});
