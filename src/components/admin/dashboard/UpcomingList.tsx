import Link from 'next/link';
import { Badge, Card, CardTitle } from '@/components/ui';
import { formatMadrid } from '@/lib/dates';
import type { UpcomingItem } from '@/modules/dashboard/types';
import { EmptyState, ErrorState } from './states';

const MODALITY: Record<string, string> = { in_person: 'Presencial', online: 'Online', phone: 'Telefono' };

export function UpcomingList({ items, failed }: { items: UpcomingItem[]; failed?: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="text-xl">Proximas citas</CardTitle>
        <Link href="/admin/calendario" className="text-sm text-primary-strong underline-offset-4 hover:underline">Ver calendario</Link>
      </div>
      <div className="mt-4">
        {failed ? (
          <ErrorState>No se pudieron cargar las citas.</ErrorState>
        ) : items.length === 0 ? (
          <EmptyState title="No hay citas proximas">Cuando programes una cita aparecera aqui.</EmptyState>
        ) : (
          <ul className="divide-y divide-sand/70">
            {items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-ink-soft">{a.serviceName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{MODALITY[a.modality] ?? a.modality}</Badge>
                  <time dateTime={a.startsAt} className="text-sm tabular">{formatMadrid(new Date(a.startsAt), 'dd/MM HH:mm')}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
