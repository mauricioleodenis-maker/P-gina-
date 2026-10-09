import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { InvoiceIssueDialog, InvoiceTable, MonthFilter } from '@/components/admin/billing';
import { ButtonLink } from '@/components/ui';
import { requireAdmin } from '@/modules/auth/api';
import { listBillablePayments, listInvoices } from '@/modules/billing/api';
import { monthParam } from '@/modules/billing/schemas';

export const metadata: Metadata = { title: 'Facturas' };
export const dynamic = 'force-dynamic';

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const mes = sp.mes && monthParam.safeParse(sp.mes).success ? sp.mes : '';
  const [invoices, billable] = await Promise.all([listInvoices({ month: mes || undefined }), listBillablePayments()]);
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm"><a href="/admin/ingresos" className="text-ink-soft underline-offset-4 hover:underline">Ingresos</a></p>
          <h1 className="font-serif text-3xl">Facturas</h1>
        </div>
        <InvoiceIssueDialog billable={billable} />
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <MonthFilter value={mes} basePath="/admin/ingresos/facturas" />
        <ButtonLink href={`/api/invoices/export?type=invoices${mes ? `&month=${mes}` : ''}`} variant="secondary" size="sm"><Download className="size-4" aria-hidden /> Exportar CSV</ButtonLink>
      </div>
      <p className="text-sm text-ink-soft">Datos fiscales del emisor (NIF, direccion, IVA o exencion): se editan en Ajustes. Los valores pendientes figuran como TODO_REAL en el PDF.</p>
      <InvoiceTable items={invoices} />
    </div>
  );
}
