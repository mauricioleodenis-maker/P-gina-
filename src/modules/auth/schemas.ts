import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Introduce un correo valido').max(254),
  password: z.string().min(1, 'Introduce la contrasena').max(256),
});

export const totpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'El codigo tiene 6 digitos'),
});

export const recoverySchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{5}-?[0-9A-Z]{5}$/, 'Formato: XXXXX-XXXXX'),
});

export const passwordSchema = z
  .string()
  .min(12, 'Minimo 12 caracteres')
  .max(256)
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), 'Combina mayusculas, minusculas y numeros');

export const changePasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Las contrasenas no coinciden', path: ['confirm'] });
