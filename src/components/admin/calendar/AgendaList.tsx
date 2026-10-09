'use client';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui';
import type { AppointmentView } from '@/modules/appointments/types';
import { STATUS_LABEL } from '@/modules/appointments/types';
import { dayOf, timeLabel } from './range';

const TONE = { requested: 'warn', scheduled: 'primary', confirmed: 'ok', completed: 'neutral', no_show: 'danger', cancelled: 'neutral' } as const;

export function AgendaList({ appointments, onOpen }: { appointments: AppointmentView[]; onOpen: (a: AppointmentView) => void }) {
  const groups = new Map<string, AppointmentView[]>();
  for (const a of appointments) groups.set(dayOf(a.startsAt), [...(groups.get(dayOf(a.startsAt)) ?? []), a]);
  if (!groups.size) return <p className="rounded-lg border border-sand bg-bg p-8 text-center text-ink-soft">No hay citas en este periodo.</p>;
  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([day, list]) => (
        <section key={day} aria-labelledby={`ag-${day}`}>
          <h3 id={`ag-${day}`} className="mb-2 font-serif text-lg capitalize">{formatInTimeZone(new Date(`${day}T12:00:00Z`), 'UTC', "EEEE d 'de' MMMM", { locale: es })}</h3>
          <ul className="divide-y divide-sand overflow-hidden rounded-lg border border-sand bg-bg">
            {list.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onOpen(a)} className="flex w-full min-h-14 items-center gap-4 px-4 py-3 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="w-24 shrink-0 tabular-nums text-sm text-ink-soft">{timeLabel(a.startsAt)} – {timeLabel(a.endsAt)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{a.name}</span>
                    <span className="block truncate text-sm text-ink-soft">{a.serviceName} · {a.modality === 'online' ? 'Online' : 'Presencial'}{a.seriesId ? ' · serie' : ''}</span>
                  </span>
                  <Badge tone={TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
