import { CalendarDays, FileLock2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { TimelineEvent } from '@/modules/patients/types';

const ICON = { appointment: CalendarDays, note: FileLock2, consent: ShieldCheck } as const;
const KIND = { appointment: 'Cita', note: 'Nota', consent: 'Consentimiento' } as const;

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return <p className="text-ink-soft">Todavia no hay actividad registrada.</p>;
  return (
    <ol className="relative grid gap-4 border-l border-sand pl-6">
      {events.map((e) => {
        const Icon = ICON[e.kind];
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[2.15rem] grid size-7 place-items-center rounded-full border border-sand bg-bg"><Icon className="size-3.5 text-primary" aria-hidden /></span>
            <p className="text-sm text-ink-soft">
              <time dateTime={e.at}>{new Date(e.at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'short' })}</time> - {KIND[e.kind]}
            </p>
            <p className="font-medium">{e.href ? <Link href={e.href} className="underline underline-offset-4">{e.title}</Link> : e.title}</p>
            {e.detail ? <p className="text-sm text-ink-soft">{e.detail}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
