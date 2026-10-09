import { describe, expect, it } from 'vitest';
import { computeAvailability, type AvailabilityInput } from '../slots';

const base: AvailabilityInput = {
  from: new Date('2026-06-01T00:00:00Z'), to: new Date('2026-06-02T00:00:00Z'), // lunes 1-jun
  durationMin: 50, stepMin: 60, bufferMin: 10, minNoticeHours: 0, maxAdvanceDays: 365,
  rules: [{ weekday: 1, start_time: '10:00', end_time: '13:00', modality: 'both', active: true }],
  exceptions: [], busy: [], now: new Date('2026-05-01T00:00:00Z'),
};

describe('computeAvailability', () => {
  it('genera huecos segun la regla semanal (hora Madrid)', () => {
    const s = computeAvailability(base);
    expect(s.map((x) => x.start)).toEqual(['2026-06-01T08:00:00.000Z', '2026-06-01T09:00:00.000Z', '2026-06-01T10:00:00.000Z']);
  });
  it('quita huecos con cita y buffer', () => {
    const s = computeAvailability({ ...base, busy: [{ starts_at: '2026-06-01T09:00:00Z', ends_at: '2026-06-01T09:50:00Z' }] });
    expect(s.map((x) => x.start)).toEqual(['2026-06-01T08:00:00.000Z', '2026-06-01T10:00:00.000Z']);
  });
  it('un dia cerrado no ofrece huecos', () => {
    const s = computeAvailability({ ...base, exceptions: [{ starts_on: '2026-06-01', ends_on: '2026-06-05', is_closed: true, start_time: null, end_time: null }] });
    expect(s).toEqual([]);
  });
  it('respeta antelacion minima', () => {
    const s = computeAvailability({ ...base, minNoticeHours: 12, now: new Date('2026-06-01T07:00:00Z') });
    expect(s.map((x) => x.start)).toEqual([]);
  });
});
