// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { computeSlots } from '../availability';
import { buildIcs } from '../ics';
import { bookingSchema } from '../schema';
import { generateManageToken, hashToken, isWellFormedToken } from '../token';

const base = {
  serviceId: '11111111-1111-4111-8111-111111111111',
  startsAt: '2030-03-05T10:00:00.000Z',
  modality: 'in_person' as const,
  name: 'Ana Prueba',
  email: 'ana@example.com',
  adult: true,
  consentPrivacy: true as const,
  consentHealth: true as const,
  consentReminders: false,
};

describe('bookingSchema', () => {
  it('acepta una solicitud valida', () => {
    expect(bookingSchema.safeParse(base).success).toBe(true);
  });
  it('exige consentimientos no premarcados (true literal)', () => {
    expect(bookingSchema.safeParse({ ...base, consentHealth: false }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...base, consentPrivacy: false }).success).toBe(false);
  });
  it('exige tutor si es menor', () => {
    expect(bookingSchema.safeParse({ ...base, adult: false }).success).toBe(false);
    expect(
      bookingSchema.safeParse({ ...base, adult: false, guardian: { name: 'M', relationship: 'madre', email: 'm@example.com' } }).success,
    ).toBe(true);
  });
  it('limita la nota a 500 caracteres', () => {
    expect(bookingSchema.safeParse({ ...base, note: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('token', () => {
  it('genera tokens unicos de 43 caracteres y hash estable', () => {
    const a = generateManageToken();
    const b = generateManageToken();
    expect(a.token).not.toBe(b.token);
    expect(isWellFormedToken(a.token)).toBe(true);
    expect(hashToken(a.token)).toBe(a.hash);
    expect(isWellFormedToken('corto')).toBe(false);
  });
});

describe('ics', () => {
  it('genera VEVENT con titulo neutro', () => {
    const ics = buildIcs({ uid: 'abc', startsAt: new Date('2030-03-05T10:00:00Z'), endsAt: new Date('2030-03-05T10:50:00Z'), summary: 'Cita en Caromafla', modality: 'online' });
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Cita en Caromafla');
  });
});

describe('computeSlots', () => {
  const common = {
    durationMin: 50,
    rules: [{ weekday: 2, start_time: '10:00:00', end_time: '13:00:00', modality: 'both' as const, active: true }],
    exceptions: [],
    stepMin: 60,
    bufferMin: 10,
    minNoticeHours: 12,
    maxAdvanceDays: 365 * 5,
    now: new Date('2030-03-01T00:00:00Z'),
  };
  // 2030-03-05 es martes (weekday 2); Madrid = UTC+1 en marzo antes del cambio.
  it('genera huecos dentro de la ventana en hora de Madrid', () => {
    const s = computeSlots({ ...common, busy: [], from: new Date('2030-03-04T23:00:00Z'), to: new Date('2030-03-05T23:00:00Z') });
    expect(s.map((x) => x.start)).toEqual(['2030-03-05T09:00:00.000Z', '2030-03-05T10:00:00.000Z', '2030-03-05T11:00:00.000Z']);
  });
  it('excluye citas con buffer y dias cerrados', () => {
    const range = { from: new Date('2030-03-04T23:00:00Z'), to: new Date('2030-03-05T23:00:00Z') };
    const busy = [{ starts_at: '2030-03-05T10:00:00Z', ends_at: '2030-03-05T10:50:00Z' }];
    const s = computeSlots({ ...common, ...range, busy });
    expect(s.some((x) => x.start === '2030-03-05T10:00:00.000Z')).toBe(false);
    expect(s.map((x) => x.start)).toEqual(['2030-03-05T09:00:00.000Z', '2030-03-05T11:00:00.000Z']); // el buffer de 10 min deja ambos extremos libres
    const closed = computeSlots({ ...common, ...range, busy: [], exceptions: [{ starts_on: '2030-03-05', ends_on: '2030-03-05', is_closed: true, start_time: null, end_time: null }] });
    expect(closed).toEqual([]);
  });
  it('respeta antelacion minima', () => {
    const s = computeSlots({ ...common, busy: [], now: new Date('2030-03-05T05:00:00Z'), from: new Date('2030-03-04T23:00:00Z'), to: new Date('2030-03-05T23:00:00Z') });
    expect(s).toEqual([]);
  });
});

describe('submitBooking: doble reserva', () => {
  const rpc = vi.fn();
  beforeEach(() => {
    rpc.mockReset();
    vi.resetModules();
    vi.doMock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ rpc, from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }), maybeSingle: async () => ({ data: null }) }) }) }) }) }));
    vi.doMock('@/modules/appointments/api', () => ({ getAvailability: async () => [] }));
    vi.doMock('@/lib/email/client', () => ({ getResend: () => ({}), EMAIL_FROM: 'x' }));
    delete process.env.RESEND_API_KEY;
  });

  it('dos peticiones al mismo hueco: una crea, la otra recibe slot_taken (23P01)', async () => {
    rpc.mockResolvedValueOnce({ data: 'appt-1', error: null }).mockResolvedValueOnce({ data: null, error: { code: '23P01', message: 'conflicting key value violates exclusion constraint "appointments_no_overlap"' } });
    const { submitBooking } = await import('../service');
    const [a, b] = await Promise.all([submitBooking(base, { ip: '1.1.1.1' }), submitBooking({ ...base, email: 'otra@example.com' }, { ip: '2.2.2.2' })]);
    expect([a.ok, b.ok].sort()).toEqual([false, true]);
    const fail = [a, b].find((r) => !r.ok)!;
    expect(fail.ok === false && fail.code).toBe('slot_taken');
  });

  it('traduce errores de la RPC', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0001', message: 'too_soon' } });
    const { submitBooking } = await import('../service');
    const r = await submitBooking(base, { ip: '1.1.1.1' });
    expect(r.ok === false && r.code).toBe('too_soon');
  });
});
