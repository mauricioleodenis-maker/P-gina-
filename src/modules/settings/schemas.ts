import { z } from 'zod';

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().default(null));
const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Hora HH:MM');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no valida');

export const fiscalSchema = z.object({
  business_name: z.string().trim().min(1, 'Obligatorio').max(120),
  legal_name: optText(160),
  nif: z.preprocess(blankToNull, z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,12}$/, 'NIF/CIF no valido').nullable().default(null)),
  address: optText(300),
  college_number: optText(40),
  phone: optText(30),
  contact_email: z.preprocess(blankToNull, z.string().trim().email('Correo no valido').max(254).nullable().default(null)),
  invoice_series: z.string().trim().toUpperCase().regex(/^[A-Z]{1,3}$/, 'Entre 1 y 3 letras'),
  default_vat_rate: z.coerce.number().min(0).max(21),
  vat_exemption_text: optText(400),
  invoice_footer: optText(600),
});

export const policySchema = z.object({
  slot_step_min: int(5, 60),
  buffer_min: int(0, 120),
  min_notice_hours: int(0, 720),
  max_advance_days: int(1, 365),
  cancellation_hours: int(0, 168),
  recurrence_weeks: int(4, 52),
  auto_confirm: checkbox,
});

const euros = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/\s/g, '').replace(',', '.') : v),
  z.coerce.number().min(0, 'No puede ser negativo').max(2000),
);

export const serviceSchema = z.object({
  id: z.preprocess(blankToNull, z.string().uuid().nullable().default(null)),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minusculas, numeros y guiones').max(60),
  name: z.string().trim().min(1, 'Obligatorio').max(120),
  description: optText(1000),
  duration_min: int(10, 240),
  price_eur: euros,
  modality: z.enum(['in_person', 'online', 'both']),
  sort_order: int(0, 999).default(0),
  active: checkbox,
});

export const scheduleSchema = z
  .array(
    z.object({
      weekday: int(0, 6),
      start_time: time,
      end_time: time,
      modality: z.enum(['in_person', 'online', 'both']),
      active: z.boolean(),
    }),
  )
  .max(60)
  .superRefine((rules, ctx) => {
    const byDay = new Map<number, { s: string; e: string }[]>();
    rules.forEach((r, i) => {
      if (r.end_time.slice(0, 5) <= r.start_time.slice(0, 5)) {
        ctx.addIssue({ code: 'custom', message: 'La hora de fin debe ser posterior al inicio', path: [i] });
      }
      if (!r.active) return;
      const arr = byDay.get(r.weekday) ?? [];
      arr.push({ s: r.start_time.slice(0, 5), e: r.end_time.slice(0, 5) });
      byDay.set(r.weekday, arr);
    });
    byDay.forEach((arr) => {
      arr.sort((a, b) => a.s.localeCompare(b.s));
      for (let i = 1; i < arr.length; i++) {
        const cur = arr[i];
        const prev = arr[i - 1];
        if (cur && prev && cur.s < prev.e) ctx.addIssue({ code: 'custom', message: 'Hay franjas solapadas en un mismo dia', path: [] });
      }
    });
  });

export const exceptionSchema = z
  .object({
    starts_on: date,
    ends_on: date,
    is_closed: checkbox,
    start_time: z.preprocess(blankToNull, time.nullable().default(null)),
    end_time: z.preprocess(blankToNull, time.nullable().default(null)),
    reason: optText(200),
  })
  .superRefine((v, ctx) => {
    if (v.ends_on < v.starts_on) ctx.addIssue({ code: 'custom', message: 'La fecha final es anterior', path: ['ends_on'] });
    if (!v.is_closed) {
      if (!v.start_time || !v.end_time) ctx.addIssue({ code: 'custom', message: 'Indica el horario extra', path: ['start_time'] });
      else if (v.end_time <= v.start_time) ctx.addIssue({ code: 'custom', message: 'Fin posterior al inicio', path: ['end_time'] });
    }
  });
