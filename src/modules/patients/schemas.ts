import { z } from 'zod';

const optText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

export const guardianSchema = z.object({
  name: z.string().trim().min(2, 'Nombre del tutor').max(120),
  relationship: z.string().trim().max(60).optional(),
  email: z.string().trim().toLowerCase().email('Correo del tutor no valido').max(254).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional(),
  national_id: z.string().trim().max(20).optional(),
});

export const patientSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Indica el nombre').max(120),
    email: z.string().trim().toLowerCase().email('Correo no valido').max(254).optional().or(z.literal('')).transform((v) => v || null),
    phone: optText(30),
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no valida')
      .optional()
      .or(z.literal(''))
      .transform((v) => v || null),
    national_id: optText(20),
    address: optText(200),
    emergency_contact: optText(200),
    modality: z.enum(['in_person', 'online']).default('in_person'),
    default_price_euros: z
      .string()
      .trim()
      .regex(/^\d{1,5}([.,]\d{1,2})?$/, 'Importe no valido')
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? Math.round(Number(v.replace(',', '.')) * 100) : null)),
    tags: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10) : [])),
    status: z.enum(['active', 'paused', 'discharged']).default('active'),
    internal_notes: optText(1000),
    consent_data: z.boolean().default(false),
    guardian: guardianSchema.optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.birth_date) {
      const d = new Date(v.birth_date + 'T00:00:00Z');
      if (Number.isNaN(d.getTime()) || d > new Date()) {
        ctx.addIssue({ code: 'custom', path: ['birth_date'], message: 'Fecha no valida' });
      }
    }
  });

export type PatientInput = z.input<typeof patientSchema>;
export type PatientParsed = z.output<typeof patientSchema>;

export const noteSchema = z.object({
  patientId: z.string().uuid(),
  noteId: z.string().uuid().optional(),
  template: z.enum(['free', 'soap']),
  body: z.string().min(1, 'La nota esta vacia').max(50_000, 'Nota demasiado larga'),
  appointmentId: z.string().uuid().nullable().optional(),
  /** updated_at que vio el editor: evita pisar una edicion posterior. */
  expectedUpdatedAt: z.string().optional(),
});
export type NoteInput = z.infer<typeof noteSchema>;

export const consentSchema = z.object({
  patientId: z.string().uuid(),
  purpose: z.enum(['privacy_policy', 'health_data', 'informed_consent', 'reminders', 'marketing', 'whatsapp']),
  textVersion: z.string().trim().min(1, 'Version del texto').max(40),
});

export const dataRequestUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['in_progress', 'resolved', 'rejected']),
  resolution: z.string().trim().max(1000).optional(),
});
