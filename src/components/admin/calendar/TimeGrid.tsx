'use client';
import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@/components/ui';
import type { AppointmentView, BlockView } from '@/modules/appointments/types';
import { STATUS_LABEL } from '@/modules/appointments/types';
import { STATUS_CLASS } from './status';
import { dayOf, minutesOfDay, timeLabel, toIso } from './range';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const PX_HOUR = 56;
const STEP = 15;
const PX_STEP = (PX_HOUR * STEP) / 60;

type Props = {
  days: string[];
  today: string;
  appointments: AppointmentView[];
  blocks: BlockView[];
  onOpen: (a: AppointmentView) => void;
  onCreate: (day: string, minutes: number) => void;
  onMove: (a: AppointmentView, startsAt: string, endsAt: string) => void;
};

type Drag = { id: string; mode: 'move' | 'resize'; startX: number; startY: number; dDays: number; dMin: number; moved: boolean };

const snap = (px: number) => Math.round(px / PX_STEP) * STEP;

export function TimeGrid({ days, today, appointments, blocks, onOpen, onCreate, onMove }: Props) {
  const colsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const [h0, h1] = useMemo(() => {
    let lo = 8 * 60;
    let hi = 20 * 60;
    for (const a of appointments) {
      if (a.status === 'cancelled') continue;
      lo = Math.min(lo, Math.floor(minutesOfDay(a.startsAt) / 60) * 60);
      hi = Math.max(hi, Math.ceil(minutesOfDay(a.endsAt) / 60) * 60);
    }
    return [lo, Math.min(hi, 24 * 60)];
  }, [appointments]);
  const hours = Array.from({ length: (h1 - h0) / 60 }, (_, i) => h0 / 60 + i);
  const height = ((h1 - h0) / 60) * PX_HOUR;

  const colWidth = () => (colsRef.current ? colsRef.current.getBoundingClientRect().width / days.length : 1);

  const down = (e: PointerEvent, a: AppointmentView, mode: Drag['mode']) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: a.id, mode, startX: e.clientX, startY: e.clientY, dDays: 0, dMin: 0, moved: false });
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const dx = e.clientX - drag.startX;
    const dMin = snap(dy);
    const dDays = drag.mode === 'move' && days.length > 1 ? Math.round(dx / colWidth()) : 0;
    setDrag({ ...drag, dMin, dDays, moved: drag.moved || Math.abs(dy) > 4 || Math.abs(dx) > 4 });
  };
  const up = (a: AppointmentView) => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (!d.moved) return onOpen(a);
    if (d.dMin === 0 && d.dDays === 0) return;
    const next = applyDelta(a, d);
    if (next) onMove(a, next.start, next.end);
  };

  const key = (e: KeyboardEvent, a: AppointmentView) => {
    if (!e.altKey) return;
    const step = e.key === 'ArrowUp' ? -STEP : e.key === 'ArrowDown' ? STEP : 0;
    const dDays = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!step && !dDays) return;
    e.preventDefault();
    const next = applyDelta(a, { id: a.id, mode: e.shiftKey ? 'resize' : 'move', startX: 0, startY: 0, dDays, dMin: step, moved: true });
    if (next) onMove(a, next.start, next.end);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-sand bg-bg">
      <div className="min-w-[640px]">
        <div className="sticky top-0 z-10 grid border-b border-sand bg-bg" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0,1fr))` }}>
          <div />
          {days.map((d) => {
            const dayBlocks = blocks.filter((b) => b.startsOn <= d && b.endsOn >= d);
            return (
              <div key={d} className={cn('border-l border-sand px-2 py-2 text-center', d === today && 'bg-primary/10')}>
                <p className="text-xs uppercase tracking-wide text-ink-soft">{formatInTimeZone(new Date(`${d}T12:00:00Z`), 'UTC', 'EEE', { locale: es })}</p>
                <p className={cn('text-lg font-medium', d === today && 'text-primary-strong')}>{Number(d.slice(8))}</p>
                {dayBlocks.map((b) => (
                  <p key={b.id} className="mt-0.5 rounded bg-sand/60 px-1 text-xs text-ink-soft">{b.isClosed && !b.startTime ? 'Cerrado' : 'Horario especial'}</p>
                ))}
              </div>
            );
          })}
        </div>
        <div className="grid" style={{ gridTemplateColumns: `3.5rem 1fr` }}>
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-ink-soft" style={{ top: (h - h0 / 60) * PX_HOUR }}>
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <div ref={colsRef} className="relative grid" style={{ height, gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))` }}>
            {days.map((d) => (
              <div
                key={d}
                role="button"
                tabIndex={-1}
                aria-label={`Crear cita el ${d}`}
                className={cn('relative border-l border-sand', d === today && 'bg-primary/5')}
                style={{ backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${PX_HOUR - 1}px, rgb(227 211 189 / 0.7) ${PX_HOUR - 1}px, rgb(227 211 189 / 0.7) ${PX_HOUR}px)` }}
                onDoubleClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  onCreate(d, h0 + snap(e.clientY - r.top));
                }}
              />
            ))}
            {appointments
              .map((a) => {
                const col = days.indexOf(dayOf(a.startsAt));
                if (col < 0) return null;
                const isDrag = drag?.id === a.id && drag.moved;
                const dMin = isDrag ? drag.dMin : 0;
                const dDays = isDrag && drag.mode === 'move' ? drag.dDays : 0;
                const s = minutesOfDay(a.startsAt) + (drag?.mode === 'move' ? dMin : 0);
                const eRaw = minutesOfDay(a.endsAt);
                const e = eRaw + dMin;
                const top = ((s - h0) / 60) * PX_HOUR;
                const h = Math.max(((e - s) / 60) * PX_HOUR, PX_STEP);
                const c = Math.min(Math.max(col + dDays, 0), days.length - 1);
                return (
                  <div
                    key={a.id}
                    className="absolute px-0.5"
                    style={{ top, height: h, left: `${(c / days.length) * 100}%`, width: `${100 / days.length}%`, zIndex: isDrag ? 30 : 5 }}
                  >
                    <button
                      type="button"
                      aria-label={`${a.name}, ${a.serviceName}, ${timeLabel(a.startsAt)} a ${timeLabel(a.endsAt)}, ${STATUS_LABEL[a.status]}. Alt más flechas para mover, Alt Mayús flechas arriba o abajo para cambiar duración.`}
                      onPointerDown={(ev) => down(ev, a, 'move')}
                      onPointerMove={move}
                      onPointerUp={() => up(a)}
                      onPointerCancel={() => setDrag(null)}
                      onKeyDown={(ev) => key(ev, a)}
                      onClick={(ev) => { if (ev.detail === 0) onOpen(a); }}
                      className={cn(
                        'flex h-full w-full touch-none select-none flex-col overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left text-xs leading-tight transition-shadow focus-visible:outline-2 focus-visible:outline-primary',
                        STATUS_CLASS[a.status],
                        isDrag ? 'cursor-grabbing shadow-lift' : 'cursor-grab hover:shadow-soft',
                      )}
                    >
                      <span className="truncate font-medium">{a.name}</span>
                      {h > 30 ? <span className="truncate opacity-90">{timeLabel(a.startsAt)} · {STATUS_LABEL[a.status]}</span> : null}
                      {h > 54 ? <span className="truncate opacity-80">{a.serviceName}{a.seriesId ? ' · serie' : ''}</span> : null}
                    </button>
                    {a.status !== 'cancelled' ? (
                      <span
                        aria-hidden
                        onPointerDown={(ev) => down(ev, a, 'resize')}
                        onPointerMove={move}
                        onPointerUp={() => up(a)}
                        className="absolute inset-x-2 bottom-0 h-2 cursor-ns-resize touch-none rounded-full bg-ink/20 opacity-0 hover:opacity-100"
                      />
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function applyDelta(a: AppointmentView, d: Drag): { start: string; end: string } | null {
  const day = dayOf(a.startsAt);
  const s = minutesOfDay(a.startsAt);
  const e = minutesOfDay(a.endsAt);
  const shifted = new Date(`${day}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + (d.mode === 'move' ? d.dDays : 0));
  const nd = shifted.toISOString().slice(0, 10);
  if (d.mode === 'resize') {
    const ne = e + d.dMin;
    return ne - s >= STEP ? { start: a.startsAt, end: toIso(day, ne) } : null;
  }
  const ns = s + d.dMin;
  if (ns < 0 || e + d.dMin > 24 * 60) return null;
  return { start: toIso(nd, ns), end: toIso(nd, e + d.dMin) };
}
