import { describe, expect, it } from 'vitest';
import { buildCsp, makeNonce } from '../csp';
import { generateCodes, normalize } from '../recovery';
import { safeNext } from '../redirect';
import { changePasswordSchema, loginSchema, recoverySchema, totpSchema } from '../schemas';

describe('safeNext', () => {
  it('acepta solo rutas /admin internas', () => {
    expect(safeNext('/admin/pacientes?q=a')).toBe('/admin/pacientes?q=a');
    expect(safeNext('https://evil.com')).toBe('/admin');
    expect(safeNext('//evil.com')).toBe('/admin');
    expect(safeNext('/administrador')).toBe('/admin');
    expect(safeNext('/admin\\..')).toBe('/admin');
    expect(safeNext(null)).toBe('/admin');
  });
});

describe('csp', () => {
  it('lleva nonce, frame-ancestors none y sin unsafe-eval en prod', () => {
    const n = makeNonce();
    const csp = buildCsp(n, { supabaseUrl: 'https://x.supabase.co' });
    expect(csp).toContain(`'nonce-${n}'`);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain('wss://x.supabase.co');
  });
  it('nonce distinto cada vez', () => expect(makeNonce()).not.toBe(makeNonce()));
});

describe('recovery codes', () => {
  it('genera 10 codigos unicos con formato XXXXX-XXXXX', () => {
    const codes = generateCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    codes.forEach((c) => expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/));
  });
  it('normaliza guiones y minusculas', () => expect(normalize('ab12c-de34f')).toBe('AB12CDE34F'));
});

describe('schemas', () => {
  it('login normaliza el correo', () => {
    expect(loginSchema.parse({ email: ' A@B.ES ', password: 'x' }).email).toBe('a@b.es');
    expect(loginSchema.safeParse({ email: 'no', password: 'x' }).success).toBe(false);
  });
  it('totp exige 6 digitos', () => {
    expect(totpSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(totpSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
  it('recuperacion acepta con y sin guion', () => {
    expect(recoverySchema.safeParse({ code: 'abcde-12345' }).success).toBe(true);
    expect(recoverySchema.safeParse({ code: 'abcde12345' }).success).toBe(true);
    expect(recoverySchema.safeParse({ code: 'abc' }).success).toBe(false);
  });
  it('contrasena: 12+, mezcla y coincidencia', () => {
    expect(changePasswordSchema.safeParse({ password: 'Corta1', confirm: 'Corta1' }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: 'Suficientemente1', confirm: 'Otra' }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: 'Suficientemente1', confirm: 'Suficientemente1' }).success).toBe(true);
  });
});
