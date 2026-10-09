import { z } from 'zod';
import { parseEuros } from './calc';

const euros = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const c = parseEuros(v);
    if (c === null || c <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Importe no valido' });
      return z.NEVER;
    }
    if (c > 1_000_000) {
      ctx.addIssue({ code: 'custom', message: 'Importe demasiado alto' });
      return z.NEVER;
    }
    return c;
  });

const optionalUuid = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.string().uuid().nullable());

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no valida');
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const paymentSchema = z.object({
  patientId: z.string().uuid('Elige un paciente'),
  appointmentId: optionalUuid,
  serviceId: optionalUuid,
  amount: euros,
  method: z.enum(['cash', 'card', 'transfer', 'bizum', 'other']),
  paidOn: isoDate,
  concept: optionalText(200),
});

export const markPaidSchema = z.object({
  paymentId: z.string().uuid(),
  amount: euros,
  method: z.enum(['cash', 'card', 'transfer', 'bizum', 'other']),
  paidOn: isoDate,
});

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: euros,
  reason: optionalText(200),
});

export const issueInvoiceSchema = z.object({
  patientId: z.string().uuid('Elige un paciente'),
  paymentIds: z.array(z.string().uuid()).min(1, 'Elige al menos un cobro'),
  concept: z.string().trim().min(3, 'Indica el concepto').max(200),
});

export const rectifySchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().trim().min(5, 'Indica el motivo').max(200),
});

export const monthParam = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const yearParam = z.coerce.number().int().min(2000).max(2100);
