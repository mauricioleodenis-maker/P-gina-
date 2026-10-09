import { describe, expect, it } from 'vitest';
import { requestUrgency, variationPct } from '../calc';

describe('variationPct', () => {
  it('calcula la variacion', () => expect(variationPct(150, 100)).toBe(50));
  it('sin base devuelve null', () => expect(variationPct(10, 0)).toBeNull());
  it('admite bajadas', () => expect(variationPct(50, 100)).toBe(-50));
});

describe('requestUrgency', () => {
  const now = new Date('2026-10-09T10:00:00Z');
  it('vencida', () => expect(requestUrgency('received', '2026-10-01T00:00:00Z', now).urgency).toBe('overdue'));
  it('pronto', () => expect(requestUrgency('in_progress', '2026-10-12T00:00:00Z', now).urgency).toBe('soon'));
  it('en plazo', () => expect(requestUrgency('received', '2026-11-05T00:00:00Z', now).urgency).toBe('ok'));
  it('cerrada', () => expect(requestUrgency('resolved', '2026-10-01T00:00:00Z', now)).toEqual({ daysLeft: null, urgency: 'closed' }));
});
