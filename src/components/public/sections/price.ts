import { formatCents } from '@/lib/money';

/** Precio 0 = TODO_REAL: se muestra "Consultar". */
export function priceLabel(cents: number): string {
  return cents > 0 ? formatCents(cents) : 'Consultar';
}
