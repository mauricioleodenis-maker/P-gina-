import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { PaymentDialog, PaymentsTable, PendingList, MonthFilter } from '@/components/admin/billing';
import { RevenueCharts } from '@/components/admin/charts';
import { Button, ButtonLink, Card } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { requireAdmin } from '@/modules/auth/api';
import { getPendingCharges, getRevenueReport, getYearOptions, listPayments } from '@/modules/billing/api';
import { monthParam, yearParam } from '@/modules/billing/schemas';
import { listPatients } from '@/modules/patients/api';

export const metadata: Metadata = { title: 'Ingresos' };
export const dynamic = 'force-dynamic';

export default async function IngresosPage({ searchParams }: { searchParams: Promise<{ anio?: string; mes?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const years = await getYearOptions();
  const parsed = yearParam.safeParse(sp.anio);
  const year = parsed.success ? parsed.data : (years[0] ?? new Date().getFullYear());
  const mes = sp.mes && monthParam.safeParse(sp.mes).success ? sp.mes : '';
  const [report, pending, payments, patients] = await Promise.all([
    getRevenueReport(year),
    getPendingCharges(),
    listPayments({ month: mes || undefined }),
    listPatients(),
  ]);
  const pendingTotal = pending.reduce((s, p) => s + p.balanceCents, 0);
  const variation = report.variationPct;
  const csvHref = `/api/invoices/export?type=payments${mes ? `&month=${mes}` : ''}`;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Ingresos</h1>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/ingresos/facturas" variant="secondary">Facturas</ButtonLink>
          <PaymentDialog mode="new" patients={patients.map((p) => ({ id: p.id, name: p.full_name }))} trigger={<Button>Registrar cobro</Button>} />
        </div>
      </header>

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-ink-soft">Este mes</p><p className="tabular mt-1 font-serif text-3xl">{formatCents(report.currentMonthCents)}</p>
          <p className="mt-1 text-sm text-ink-soft">Mes anterior: {formatCents(report.previousMonthCents)}</p></Card>
        <Card><p className="text-sm text-ink-soft">Total {report.year}</p><p className="tabular mt-1 font-serif text-3xl">{formatCents(report.totalCurrent)}</p>
          <p className="mt-1 text-sm text-ink-soft">{variation === null ? 'Sin datos del anio anterior' : `${variation > 0 ? '+' : ''}${variation.toFixed(0)} % frente a ${report.year - 1}`}</p></Card>
        <Card><p className="text-sm text-ink-soft">Pendiente de cobro</p><p className="tabular mt-1 font-serif text-3xl">{formatCents(pendingTotal)}</p>
          <p className="mt-1 text-sm text-ink-soft">{pending.length} {pending.length === 1 ? 'cobro' : 'cobros'}</p></Card>
      </section>

      <section className="grid gap-4" aria-labelledby="h-graficos">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-graficos" className="font-serif text-2xl">Evolucion</h2>
          <nav aria-label="Anio" className="flex flex-wrap gap-2">
            {years.map((y) => (
              <ButtonLink key={y} href={`/admin/ingresos?anio=${y}`} size="sm" variant={y === year ? 'primary' : 'secondary'} aria-current={y === year ? 'page' : undefined}>{y}</ButtonLink>
            ))}
          </nav>
        </div>
        <RevenueCharts report={report} />
      </section>

      <section className="grid gap-4" aria-labelledby="h-pend">
        <h2 id="h-pend" className="font-serif text-2xl">Pendientes de cobro</h2>
        <PendingList items={pending} />
      </section>

      <section className="grid gap-4" aria-labelledby="h-cobros">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="h-cobros" className="font-serif text-2xl">Cobros</h2>
          <div className="flex flex-wrap items-center gap-3">
            <MonthFilter value={mes} basePath="/admin/ingresos" />
            <a href={csvHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sand px-5 text-sm font-medium hover:bg-surface"><Download className="size-4" aria-hidden /> Exportar CSV</a>
          </div>
        </div>
        <PaymentsTable items={payments} />
      </section>
    </div>
  );
}
