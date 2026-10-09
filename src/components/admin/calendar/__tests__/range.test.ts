import { describe, expect, it } from 'vitest';
import { getRange, mondayOf, stepDay, toIso, visibleDays } from '../range';

describe('rangos del calendario', () => {
  it('semana empieza en lunes', () => {
    expect(mondayOf('2026-03-29')).toBe('2026-03-23'); // domingo
    expect(visibleDays('week', '2026-03-25')[0]).toBe('2026-03-23');
  });
  it('mes: cuadricula completa de semanas', () => {
    const d = visibleDays('month', '2026-03-15');
    expect(d.length % 7).toBe(0);
    expect(d[0]).toBe('2026-02-23');
    expect(d[d.length - 1]).toBe('2026-04-05');
  });
  it('febrero 2026 ocupa 4 semanas exactas', () => {
    const d = visibleDays('month', '2026-02-10');
    expect([d[0], d.length, d[d.length - 1]]).toEqual(['2026-01-26', 35, '2026-03-01']);
  });
  it('navega por meses', () => {
    expect(stepDay('month', '2026-01-31', 1)).toBe('2026-02-01');
    expect(stepDay('month', '2026-01-10', -1)).toBe('2025-12-01');
  });
  it('la semana del cambio horario dura 7 dias de Madrid (167 h)', () => {
    const { from, to } = getRange('week', '2026-03-25');
    expect((to.getTime() - from.getTime()) / 3_600_000).toBe(167);
  });
  it('toIso respeta DST', () => {
    expect(toIso('2026-03-30', 600)).toBe('2026-03-30T08:00:00.000Z');
    expect(toIso('2026-03-27', 600)).toBe('2026-03-27T09:00:00.000Z');
  });
});
