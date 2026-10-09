import type { Metadata } from 'next';
import { Suspense } from 'react';
import { formatCents } from '@/lib/money';
import { formatMadrid } from '@/lib/dates';
import { requireAdmin } from '@/modules/auth/api';
import { getDashboardAlerts, getDashboardKpis, getUpcomingAppointments } from '@/modules/dashboard/api';
import { variationPct } from '@/modules/dashboard/calc';
import {
  AlertsPanel, DashboardSkeleton, KpiCard, KpiGrid, Shortcuts, UpcomingList,
} from '@/components/admin/dashboard';
import { Reveal } from '@/components/motion';

export const metadata: Metadata = { title: 'Inicio' };

async function DashboardContent() {
  const kpis = await getDashboardKpis();
  const [alerts, upcoming] = await Promise.all([
    getDashboardAlerts(kpis).catch(() => []),
    getUpcomingAppointments(5).then((value) => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
  ]);
  const { appointmentsToday, incomeMonth, activePatients, pendingCharges, nextAppointment, newRequests } = kpis;
  return (
    <div className="grid gap-6">
      <KpiGrid>
        <KpiCard label="Citas de hoy" value={appointmentsToday.ok ? appointmentsToday.value : null} failed={!appointmentsToday.ok} href="/admin/calendario" />
        <KpiCard
          label="Ingresos del mes"
          value={incomeMonth.ok ? incomeMonth.value.cents : null}
          format={(n) => formatCents(n)}
          trendPct={incomeMonth.ok ? variationPct(incomeMonth.value.cents, incomeMonth.value.previousCents) : null}
          failed={!incomeMonth.ok}
          href="/admin/ingresos"
        />
        <KpiCard label="Pacientes activos" value={activePatients.ok ? activePatients.value : null} failed={!activePatients.ok} href="/admin/pacientes" />
        <KpiCard
          label="Pagos pendientes"
          value={pendingCharges.ok ? pendingCharges.value.balanceCents : null}
          format={(n) => formatCents(n)}
          hint={pendingCharges.ok ? `${pendingCharges.value.count} cobro(s)` : undefined}
          failed={!pendingCharges.ok}
          href="/admin/ingresos"
        />
        <KpiCard
          label="Solicitudes nuevas"
          value={newRequests.ok ? newRequests.value : null}
          failed={!newRequests.ok}
          hint={newRequests.ok && newRequests.value === 0 ? 'Nada por responder' : undefined}
          href="/admin/solicitudes"
        />
        <KpiCard
          label="Proxima cita"
          value={nextAppointment.ok && nextAppointment.value ? 1 : nextAppointment.ok ? 0 : null}
          failed={!nextAppointment.ok}
          format={() => (nextAppointment.ok && nextAppointment.value ? formatMadrid(new Date(nextAppointment.value.startsAt), 'dd/MM HH:mm') : 'Sin citas')}
          hint={nextAppointment.ok && nextAppointment.value ? `${nextAppointment.value.name} · ${nextAppointment.value.serviceName}` : undefined}
          href="/admin/calendario"
        />
      </KpiGrid>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Reveal><UpcomingList items={upcoming.ok ? upcoming.value : []} failed={!upcoming.ok} /></Reveal>
        <div className="grid content-start gap-6">
          <Reveal delay={80}><AlertsPanel alerts={alerts} /></Reveal>
          <Reveal delay={160}><Shortcuts /></Reveal>
        </div>
      </div>
    </div>
  );
}

export default async function AdminHomePage() {
  await requireAdmin();
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-serif text-3xl">Inicio</h1>
        <p className="text-ink-soft">Resumen de tu consulta.</p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
