import { describe, expect, it } from 'vitest';
import {
  baseFromTotal, buildReport, centsToPlain, formatInvoiceNumber, invoiceTotals, monthlySeries, parseEuros, variationPct,
} from '../calc';
import { buildCsv, csvMoney, csvText } from '../csv';
import { paymentSchema } from '../schemas';

describe('parseEuros', () => {
  it('acepta formatos es/en', () => {
    expect(parseEuros('45')).toBe(4500);
    expect(parseEuros('45,5')).toBe(4550);
    expect(parseEuros('1.234,50')).toBe(123450);
    expect(parseEuros('45.50')).toBe(4550);
    expect(parseEuros('abc')).toBeNull();
    expect(parseEuros('')).toBeNull();
  });
  it('centsToPlain', () => {
    expect(centsToPlain(4505)).toBe('45,05');
    expect(centsToPlain(-250)).toBe('-2,50');
  });
});

describe('series de ingresos', () => {
  const rows = [
    { amount_cents: 6000, status: 'paid', paid_at: '2026-03-10T10:00:00Z', method: 'cash' as const, service_id: 's1' },
    { amount_cents: 2000, status: 'refunded', paid_at: '2026-03-12T10:00:00Z', method: 'cash' as const, service_id: 's1' },
    { amount_cents: 5000, status: 'pending', paid_at: null, method: 'cash' as const, service_id: 's1' },
    { amount_cents: 4000, status: 'paid', paid_at: '2025-03-10T10:00:00Z', method: 'bizum' as const, service_id: null },
    // 31 dic 23:30 UTC = 1 ene Madrid
    { amount_cents: 1000, status: 'paid', paid_at: '2026-12-31T23:30:00Z', method: 'card' as const, service_id: 's1' },
  ];
  it('12 meses, mes sin ingresos a cero, reembolso resta, zona Madrid', () => {
    const s = monthlySeries(rows, 2026);
    expect(s).toHaveLength(12);
    expect(s[2].incomeCents).toBe(4000);
    expect(s[0].incomeCents).toBe(0);
    expect(s[11].incomeCents).toBe(0);
    expect(monthlySeries(rows, 2027)[0].incomeCents).toBe(1000);
  });
  it('informe anual con variacion y desgloses', () => {
    const r = buildReport(rows, 2026, new Map([['s1', 'Sesion individual']]), new Date('2026-04-15T10:00:00Z'));
    expect(r.totalCurrent).toBe(4000);
    expect(r.totalPrevious).toBe(4000);
    expect(r.variationPct).toBe(0);
    expect(r.byService[0].label).toBe('Sesion individual');
    expect(r.currentMonthCents).toBe(0);
    expect(r.previousMonthCents).toBe(4000);
  });
  it('variacion sin base previa es null', () => expect(variationPct(10, 0)).toBeNull());
});

describe('facturas', () => {
  it('numero sin huecos formateado', () => expect(formatInvoiceNumber('F', 2026, 7)).toBe('F-2026-0007'));
  it('totales con IVA', () => {
    expect(invoiceTotals(5000, 21)).toEqual({ subtotalCents: 5000, vatCents: 1050, totalCents: 6050 });
    expect(baseFromTotal(6050, 21)).toBe(5000);
    expect(invoiceTotals(5000, 0).totalCents).toBe(5000);
  });
});

describe('CSV seguro', () => {
  it('neutraliza formulas y escapa separadores', () => {
    expect(csvText('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvText('+34 600')).toBe("'+34 600");
    expect(csvText('a;b')).toBe('"a;b"');
    expect(csvText('linea1\nlinea2')).toBe('linea1 linea2');
    expect(csvText(null)).toBe('');
  });
  it('BOM, separador ; y coma decimal', () => {
    const out = buildCsv(['A', 'B'], [['x', csvMoney(1250)]]);
    expect(out.startsWith('﻿')).toBe(true);
    expect(out).toContain('x;12,50');
  });
});

describe('paymentSchema', () => {
  const base = { patientId: '3f1c1d2e-6b0a-4c8e-9a52-1b2c3d4e5f60', amount: '60,00', method: 'cash', paidOn: '2026-03-10' };
  it('convierte a centimos y vacios a null', () => {
    const r = paymentSchema.parse({ ...base, appointmentId: '', concept: '' });
    expect(r.amount).toBe(6000);
    expect(r.appointmentId).toBeNull();
    expect(r.concept).toBeNull();
  });
  it('rechaza importe 0 o invalido', () => {
    expect(paymentSchema.safeParse({ ...base, amount: '0' }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, amount: 'x' }).success).toBe(false);
  });
});
