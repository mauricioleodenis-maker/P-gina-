import { NextResponse, type NextRequest } from 'next/server';
import { formatMadrid } from '@/lib/dates';
import { logAudit } from '@/lib/audit';
import { requireAdmin } from '@/modules/auth/api';
import { listInvoices, listPayments } from '@/modules/billing/api';
import { buildCsv, csvMoney, csvText } from '@/modules/billing/csv';
import { monthParam } from '@/modules/billing/schemas';
import { INVOICE_STATUS_LABEL, METHOD_LABEL, PAYMENT_STATUS_LABEL } from '@/modules/billing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** CSV seguro (separador ;, BOM, escape de formulas). Solo admin aal2. */
export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') === 'invoices' ? 'invoices' : 'payments';
  const monthRaw = sp.get('month');
  const month = monthRaw && monthParam.safeParse(monthRaw).success ? monthRaw : undefined;
  let csv: string;
  if (type === 'payments') {
    const rows = await listPayments({ month, limit: 5000 });
    csv = buildCsv(
      ['Fecha', 'Paciente', 'Concepto', 'Servicio', 'Metodo', 'Estado', 'Importe (EUR)', 'Factura'],
      rows.map((r) => [
        r.paidAt ? formatMadrid(new Date(r.paidAt), 'yyyy-MM-dd') : '',
        csvText(r.patientName), csvText(r.concept), csvText(r.serviceName),
        METHOD_LABEL[r.method], PAYMENT_STATUS_LABEL[r.status],
        csvMoney(r.status === 'refunded' ? -r.amountCents : r.amountCents), csvText(r.invoiceNumber),
      ]),
    );
  } else {
    const rows = await listInvoices({ month, limit: 5000 });
    csv = buildCsv(
      ['Numero', 'Fecha', 'Paciente', 'Concepto', 'Base (EUR)', 'IVA (EUR)', 'Total (EUR)', 'Estado', 'Rectifica a'],
      rows.map((r) => [
        csvText(r.number), r.issuedOn, csvText(r.patientName), csvText(r.concept),
        csvMoney(r.subtotalCents), csvMoney(r.vatCents), csvMoney(r.totalCents),
        INVOICE_STATUS_LABEL[r.status], csvText(r.rectifiesNumber),
      ]),
    );
  }
  await logAudit({ action: 'billing.export', table: type, rowId: month ?? 'all' });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-${month ?? 'todo'}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
