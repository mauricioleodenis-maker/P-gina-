import { centsToPlain } from './calc';

const BOM = '﻿';
const SEP = ';';

/**
 * Texto seguro para CSV: evita inyeccion de formulas (=,+,-,@, tab, CR) anteponiendo `'`
 * y entrecomilla si hay separador, comillas o saltos de linea.
 */
export function csvText(value: string | null | undefined): string {
  let s = (value ?? '').replace(/\r\n|\r|\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Importe en euros con coma decimal (no es texto libre: no se escapa). */
export const csvMoney = (cents: number) => centsToPlain(cents);

export function buildCsv(header: string[], rows: string[][]): string {
  return BOM + [header, ...rows].map((r) => r.join(SEP)).join('\r\n') + '\r\n';
}
