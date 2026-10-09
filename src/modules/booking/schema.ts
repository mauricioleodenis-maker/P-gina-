import { z } from 'zod';

import { CONSENT_TEXT_VERSION } from './consent-texts';
export { CONSENT_TEXT_VERSION };


const trimmed = (max: number) => z.string().trim().max(max);

export const guardianSchema = z.object({
  name: trimmed(120).min(1, 'Indica el nombre de la persona tutora.'),
  relationship: trimmed(60).min(1, 'Indica la relación (madre, padre, tutor legal…).'),
  email: trimmed(254).email('Revisa el correo de la persona tutora.'),
  phone: trimmed(30).optional().or(z.literal('')),
});

export const bookingSchema = z
  .object({
    serviceId: z.string().uuid('Elige un servicio.'),
    startsAt: z.string().datetime({ offset: true, message: 'Elige un día y una hora.' }),
    modality: z.enum(['in_person', 'online']),
    name: trimmed(120).min(1, 'Escribe tu nombre.'),
    email: trimmed(254).email('Revisa el correo electrónico.'),
    phone: trimmed(30).optional().or(z.literal('')),
    adult: z.boolean(),
    guardian: guardianSchema.optional(),
    note: trimmed(500).optional().or(z.literal('')),
    consentPrivacy: z.literal(true, { message: 'Necesito que aceptes la política de privacidad.' }),
    consentHealth: z.literal(true, { message: 'Necesito tu consentimiento para tratar los datos de salud.' }),
    consentReminders: z.boolean().default(false),
    website: z.string().optional(), // honeypot
    turnstileToken: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.adult && !v.guardian) {
      ctx.addIssue({ code: 'custom', path: ['guardian'], message: 'Si eres menor de 18 años, necesito los datos de tu tutor/a.' });
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const slotsQuerySchema = z.object({
  service: z.string().uuid(),
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  modality: z.enum(['in_person', 'online']).optional(),
});

/** Aplana los errores de zod a { campo: mensaje }. */
export function flattenIssues(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.length > 1 && i.path[0] === 'guardian' ? `guardian.${String(i.path[1])}` : String(i.path[0] ?? 'form');
    out[key] ??= i.message;
  }
  return out;
}
