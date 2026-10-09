import { describe, expect, it } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';
import { buildRrule, expandOccurrences, untilFromCount } from '../recurrence';

const madrid = (d: Date) => formatInTimeZone(d, 'Europe/Madrid', 'yyyy-MM-dd HH:mm');

describe('recurrencia en Europe/Madrid', () => {
  // Martes 2026-03-17 10:00 Madrid (CET, UTC+1)
  const dtstart = new Date('2026-03-17T09:00:00Z');

  it('mantiene las 10:00 locales al cruzar el cambio a horario de verano (29-mar-2026)', () => {
    const occ = expandOccurrences({
      rrule: buildRrule('weekly'), dtstart,
      from: dtstart, to: new Date('2026-06-01T00:00:00Z'),
    });
    expect(occ.length).toBeGreaterThanOrEqual(8);
    for (const d of occ) expect(madrid(d).endsWith('10:00')).toBe(true);
    // 31-mar ya es CEST: 10:00 local = 08:00Z
    const mar31 = occ.find((d) => madrid(d).startsWith('2026-03-31'))!;
    expect(mar31.toISOString()).toBe('2026-03-31T08:00:00.000Z');
    expect(occ[0]!.toISOString()).toBe('2026-03-17T09:00:00.000Z');
  });

  it('mantiene la hora al volver al horario de invierno (25-oct-2026)', () => {
    const start = new Date('2026-10-13T08:00:00Z'); // 10:00 CEST
    const occ = expandOccurrences({ rrule: buildRrule('weekly'), dtstart: start, from: start, to: new Date('2026-12-01T00:00:00Z') });
    for (const d of occ) expect(madrid(d).endsWith('10:00')).toBe(true);
    expect(occ.find((d) => madrid(d).startsWith('2026-10-27'))!.toISOString()).toBe('2026-10-27T09:00:00.000Z');
  });

  it('quincenal y mensual', () => {
    const bi = expandOccurrences({ rrule: buildRrule('biweekly'), dtstart, from: dtstart, to: new Date('2026-05-01T00:00:00Z') });
    expect(bi.map(madrid).slice(0, 3)).toEqual(['2026-03-17 10:00', '2026-03-31 10:00', '2026-04-14 10:00']);
    const mo = expandOccurrences({ rrule: buildRrule('monthly'), dtstart, from: dtstart, to: new Date('2026-07-01T00:00:00Z') });
    expect(mo.map(madrid)).toEqual(['2026-03-17 10:00', '2026-04-17 10:00', '2026-05-17 10:00', '2026-06-17 10:00']);
  });

  it('respeta until y la ventana from/to (to exclusivo)', () => {
    const occ = expandOccurrences({ rrule: buildRrule('weekly'), dtstart, until: '2026-04-07', from: dtstart, to: new Date('2026-12-01T00:00:00Z') });
    expect(occ.map(madrid)).toEqual(['2026-03-17 10:00', '2026-03-24 10:00', '2026-03-31 10:00', '2026-04-07 10:00']);
    const win = expandOccurrences({ rrule: buildRrule('weekly'), dtstart, from: new Date('2026-03-24T00:00:00Z'), to: new Date('2026-03-31T08:00:00Z') });
    expect(win.map(madrid)).toEqual(['2026-03-24 10:00']);
  });

  it('untilFromCount da la fecha de la N-esima ocurrencia', () => {
    expect(untilFromCount(buildRrule('weekly'), dtstart, 12)).toBe('2026-06-02');
  });
});
