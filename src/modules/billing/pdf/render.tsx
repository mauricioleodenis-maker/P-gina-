import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument, type InvoicePdfData } from './InvoiceDocument';
import type { FiscalSnapshot } from '../types';

/** Convierte una fila de invoices (+ snapshot congelado) en el PDF. Runtime Node. */
export async function renderInvoicePdf(row: {
  number: string; issued_on: string; concept: string; subtotal_cents: number; vat_rate: number | string;
  vat_cents: number; total_cents: number; series: string; fiscal_snapshot: unknown;
}): Promise<Buffer> {
  const snapshot = (row.fiscal_snapshot ?? {}) as Partial<FiscalSnapshot>;
  const data: InvoicePdfData = {
    number: row.number,
    issuedOn: row.issued_on,
    concept: row.concept,
    subtotalCents: row.subtotal_cents,
    vatRate: Number(row.vat_rate),
    vatCents: row.vat_cents,
    totalCents: row.total_cents,
    isRectification: !!snapshot.rectification || row.series === 'R',
    snapshot: {
      issuer: snapshot.issuer ?? { name: 'Caromafla', legalName: null, nif: null, address: null, collegeNumber: null, phone: null, email: null },
      receiver: snapshot.receiver ?? { name: 'Cliente', nif: null, address: null },
      vatExemptionText: snapshot.vatExemptionText ?? null,
      footer: snapshot.footer ?? null,
      rectification: snapshot.rectification ?? null,
    },
  };
  return renderToBuffer(<InvoiceDocument data={data} />);
}
