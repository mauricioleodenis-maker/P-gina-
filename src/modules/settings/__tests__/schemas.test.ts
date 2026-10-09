import { describe, expect, it } from 'vitest';
import { exceptionSchema, fiscalSchema, policySchema, scheduleSchema, serviceSchema } from '../schemas';

describe('fiscalSchema', () => {
  it('vacios a null y NIF en mayusculas', () => {
    const r = fiscalSchema.parse({ business_name: 'X', invoice_series: 'f', default_vat_rate: '0', nif: ' b12345678 ', phone: '' });
    expect(r.nif).toBe('B12345678');
    expect(r.phone).toBeNull();
    expect(r.invoice_series).toBe('F');
  });
  it('rechaza IVA > 21', () => {
    expect(fiscalSchema.safeParse({ business_name: 'X', invoice_series: 'F', default_vat_rate: '30' }).success).toBe(false);
  });
});

describe('policySchema', () => {
  it('checkbox ausente es false y limites', () => {
    const base = { slot_step_min: '15', buffer_min: '10', min_notice_hours: '12', max_advance_days: '60', cancellation_hours: '24', recurrence_weeks: '12' };
    expect(policySchema.parse(base).auto_confirm).toBe(false);
    expect(policySchema.parse({ ...base, auto_confirm: 'on' }).auto_confirm).toBe(true);
    expect(policySchema.safeParse({ ...base, recurrence_weeks: '2' }).success).toBe(false);
  });
});

describe('serviceSchema', () => {
  it('precio con coma', () => {
    const r = serviceSchema.parse({ slug: 'terapia-individual', name: 'T', duration_min: '50', price_eur: '60,50', modality: 'both' });
    expect(r.price_eur).toBe(60.5);
    expect(r.id).toBeNull();
  });
  it('slug invalido', () => {
    expect(serviceSchema.safeParse({ slug: 'Mal Slug', name: 'T', duration_min: '50', price_eur: '0', modality: 'both' }).success).toBe(false);
  });
});

describe('scheduleSchema', () => {
  const r = (s: string, e: string, extra = {}) => ({ weekday: 1, start_time: s, end_time: e, modality: 'both', active: true, ...extra });
  it('valido', () => expect(scheduleSchema.safeParse([r('09:00', '13:00'), r('16:00', '20:00')]).success).toBe(true));
  it('fin antes de inicio', () => expect(scheduleSchema.safeParse([r('13:00', '09:00')]).success).toBe(false));
  it('solape el mismo dia', () => expect(scheduleSchema.safeParse([r('09:00', '13:00'), r('12:00', '15:00')]).success).toBe(false));
  it('inactivas no cuentan para el solape', () =>
    expect(scheduleSchema.safeParse([r('09:00', '13:00'), r('12:00', '15:00', { active: false })]).success).toBe(true));
});

describe('exceptionSchema', () => {
  it('rango invertido', () => {
    expect(exceptionSchema.safeParse({ starts_on: '2026-08-10', ends_on: '2026-08-01', is_closed: 'on' }).success).toBe(false);
  });
  it('horario extra exige horas', () => {
    expect(exceptionSchema.safeParse({ starts_on: '2026-08-01', ends_on: '2026-08-01' }).success).toBe(false);
    expect(exceptionSchema.safeParse({ starts_on: '2026-08-01', ends_on: '2026-08-01', start_time: '10:00', end_time: '12:00' }).success).toBe(true);
  });
});
