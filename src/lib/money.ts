/** Importes en centimos enteros. */
export function formatCents(cents: number, locale = 'es-ES', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

export function toCents(euros: number): number {
  return Math.round(euros * 100);
}
