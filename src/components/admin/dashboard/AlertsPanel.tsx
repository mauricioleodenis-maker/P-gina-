import Link from 'next/link';
import { Badge, Card, CardTitle } from '@/components/ui';
import type { DashboardAlert } from '@/modules/dashboard/types';

export function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <Card>
      <CardTitle className="text-xl">Pendiente de atender</CardTitle>
      {alerts.length === 0 ? (
        <p className="mt-3 text-ink-soft">Todo al dia. No hay avisos ahora mismo.</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {alerts.map((a) => (
            <li key={a.key} className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Badge tone={a.tone}>{a.tone === 'danger' ? 'Urgente' : 'Aviso'}</Badge>
                <span>{a.text}</span>
              </span>
              <Link href={a.href} className="text-sm font-medium text-primary-strong underline-offset-4 hover:underline">{a.cta}</Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
