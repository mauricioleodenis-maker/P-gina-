import { describe, expect, it } from 'vitest';
import { formatMadrid } from '../dates';
import { toCents } from '../money';

describe('lib', () => {
  it('convierte euros a centimos', () => expect(toCents(55.5)).toBe(5550));
  it('formatea en Europe/Madrid (verano UTC+2)', () =>
    expect(formatMadrid(new Date('2026-07-01T10:00:00Z'), 'HH:mm')).toBe('12:00'));
});
