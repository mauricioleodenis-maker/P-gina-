import { describe, expect, it } from 'vitest';
import { ageOn, isMinor, matchesQuery, normalize } from '../search';
import { noteSchema, patientSchema } from '../schemas';

describe('busqueda sin acentos', () => {
  it('normaliza', () => expect(normalize('  José ÁNGEL ')).toBe('jose angel'));
  it('encuentra con y sin acento', () => {
    expect(matchesQuery(['José Pérez', null], 'jose')).toBe(true);
    expect(matchesQuery(['Jose Perez'], 'JOSÉ pérez')).toBe(true);
    expect(matchesQuery(['Ana Ruiz'], 'jose')).toBe(false);
    expect(matchesQuery(['Ana'], '')).toBe(true);
  });
});

describe('edad y menores', () => {
  const today = new Date('2026-10-09T12:00:00Z');
  it('calcula edad', () => {
    expect(ageOn('2008-10-10', today)).toBe(17);
    expect(ageOn('2008-10-09', today)).toBe(18);
    expect(ageOn(null, today)).toBeNull();
  });
  it('detecta menor', () => {
    expect(isMinor('2012-01-01', today)).toBe(true);
    expect(isMinor('1990-01-01', today)).toBe(false);
  });
});

describe('schemas', () => {
  it('paciente minimo y conversion de precio', () => {
    const r = patientSchema.parse({ full_name: 'Ana Ruiz', default_price_euros: '55,50', tags: 'a, b' });
    expect(r.default_price_euros).toBe(5550);
    expect(r.tags).toEqual(['a', 'b']);
    expect(r.email).toBeNull();
  });
  it('rechaza nombre corto y fecha futura', () => {
    expect(patientSchema.safeParse({ full_name: 'A' }).success).toBe(false);
    expect(patientSchema.safeParse({ full_name: 'Ana', birth_date: '2999-01-01' }).success).toBe(false);
  });
  it('nota vacia no valida', () => {
    expect(noteSchema.safeParse({ patientId: crypto.randomUUID(), template: 'free', body: '' }).success).toBe(false);
  });
});
