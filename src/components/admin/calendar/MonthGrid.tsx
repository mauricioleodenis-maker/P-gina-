'use client';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { cn } from '@/components/ui';
import type { AppointmentView, BlockView } from '@/modules/appointments/types';
import { STATUS_LABEL } from '@/modules/appointments/types';
import { STATUS_CLASS } from './status';
import { dayOf, timeLabel } from './range';

type Props = {
  days: string[];
  month: string; // yyyy-MM
  today: string;
  appointments: AppointmentView[];
  blocks: BlockView[];
  onOpen: (a: AppointmentView) => void;
  onDay: (day: string) => void;
};

export function MonthGrid({ days, month, today, appointments, blocks, onOpen, onDay }: Props) {
  const byDay = new Map<string, AppointmentView[]>();
  for (const a of appointments) {
    if (a.status === 'cancelled') continue;
    const k = dayOf(a.startsAt);
    byDay.set(k, [...(byDay.get(k) ?? []), a]);
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-sand bg-bg">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-sand text-center text-xs uppercase tracking-wide text-ink-soft">
          {days.slice(0, 7).map((d) => (
            <div key={d} className="py-2">{formatInTimeZone(new Date(`${d}T12:00:00Z`), 'UTC', 'EEE', { locale: es })}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const list = byDay.get(d) ?? [];
            const closed = blocks.some((b) => b.isClosed && !b.startTime && b.startsOn <= d && b.endsOn >= d);
            return (
              <div key={d} className={cn('min-h-28 border-b border-l border-sand p-1.5', !d.startsWith(month) && 'bg-surface/60 text-ink-soft', d === today && 'bg-primary/10', closed && 'bg-sand/40')}>
                <button type="button" onClick={() => onDay(d)} aria-label={`Ver el día ${d}`} className="mb-1 grid size-8 place-items-center rounded-full text-sm hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary">
                  {Number(d.slice(8))}
                </button>
                {closed ? <p className="mb-1 text-xs text-ink-soft">Cerrado</p> : null}
                <ul className="space-y-1">
                  {list.slice(0, 3).map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => onOpen(a)} aria-label={`${a.name}, ${timeLabel(a.startsAt)}, ${STATUS_LABEL[a.status]}`} className={cn('w-full truncate rounded border-l-4 px-1.5 py-0.5 text-left text-xs', STATUS_CLASS[a.status])}>
                        <span className="tabular-nums">{timeLabel(a.startsAt)}</span> {a.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {list.length > 3 ? (
                  <button type="button" onClick={() => onDay(d)} className="mt-1 text-xs text-primary-strong underline">+{list.length - 3} más</button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
