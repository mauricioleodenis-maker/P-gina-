'use client';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, cn, useToast } from '@/components/ui';
import { moveAppointmentAction } from '@/modules/appointments/actions';
import type { AppointmentView, BlockView } from '@/modules/appointments/types';
import { AgendaList } from './AgendaList';
import { AppointmentDialog, type DialogTarget, type FormOptions } from './AppointmentDialog';
import { MonthGrid } from './MonthGrid';
import { TimeGrid } from './TimeGrid';
import { VIEWS, stepDay, titleFor, todayMadrid, visibleDays, type View } from './range';

type Props = { view: View; day: string; appointments: AppointmentView[]; blocks: BlockView[]; options: FormOptions; explicitView: boolean };
type Undo = { id: string; prev: { start: string; end: string }; label: string };

const PREF_KEY = 'cm_cal_view';
const UNDO_MS = 10_000;

export function CalendarView(props: Props) {
  return <Inner {...props} />;
}

function Inner({ view, day, appointments, blocks, options, explicitView }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(appointments);
  const [target, setTarget] = useState<DialogTarget>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [undo, setUndo] = useState<Undo | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const today = todayMadrid();

  useEffect(() => setItems(appointments), [appointments]);

  // Preferencia de vista (solo si la URL no la fija) y movil -> agenda.
  useEffect(() => {
    if (explicitView) {
      try { localStorage.setItem(PREF_KEY, view); } catch { /* sin storage */ }
      return;
    }
    let pref: string | null = null;
    try { pref = localStorage.getItem(PREF_KEY); } catch { /* sin storage */ }
    const next = (pref && VIEWS.some((v) => v.id === pref) ? (pref as View) : null) ?? (window.innerWidth < 768 ? 'agenda' : null);
    if (next && next !== view) router.replace(`/admin/calendario?view=${next}&date=${day}`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((v: View, d: string) => router.push(`/admin/calendario?view=${v}&date=${d}`), [router]);
  const days = useMemo(() => visibleDays(view, day), [view, day]);
  const shown = useMemo(() => (showCancelled ? items : items.filter((a) => a.status !== 'cancelled')), [items, showCancelled]);

  const setPatch = (id: string, start: string, end: string) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, startsAt: start, endsAt: end } : x)));

  const onMove = async (a: AppointmentView, start: string, end: string) => {
    const prev = { start: a.startsAt, end: a.endsAt };
    setPatch(a.id, start, end);
    const r = await moveAppointmentAction(a.id, start, end);
    if (!r.ok) {
      setPatch(a.id, prev.start, prev.end);
      toast({ title: 'No se pudo mover la cita', description: r.error, tone: 'danger' });
      return;
    }
    clearTimeout(timer.current);
    setUndo({ id: a.id, prev, label: a.name });
    timer.current = setTimeout(() => setUndo(null), UNDO_MS);
    router.refresh();
  };

  const doUndo = async () => {
    if (!undo) return;
    const u = undo;
    setUndo(null);
    clearTimeout(timer.current);
    setPatch(u.id, u.prev.start, u.prev.end);
    const r = await moveAppointmentAction(u.id, u.prev.start, u.prev.end);
    if (!r.ok) toast({ title: 'No se pudo deshacer', description: r.error, tone: 'danger' });
    router.refresh();
  };

  const saved = (message: string) => { toast({ title: message, tone: 'ok' }); router.refresh(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" aria-label="Anterior" onClick={() => go(view, stepDay(view, day, -1))}><ChevronLeft className="size-4" aria-hidden /></Button>
          <Button variant="secondary" size="sm" onClick={() => go(view, today)}>Hoy</Button>
          <Button variant="secondary" size="sm" aria-label="Siguiente" onClick={() => go(view, stepDay(view, day, 1))}><ChevronRight className="size-4" aria-hidden /></Button>
        </div>
        <h2 className="min-w-0 flex-1 font-serif text-xl capitalize" aria-live="polite">{titleFor(view, day)}</h2>
        <div role="tablist" aria-label="Vista" className="flex rounded-full border border-sand bg-bg p-0.5">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => go(v.id, day)} className={cn('min-h-9 rounded-full px-3.5 text-sm transition-colors', view === v.id ? 'bg-primary text-primary-ink' : 'hover:bg-surface')}>
              {v.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setTarget({ kind: 'create', day: day < today && view !== 'day' ? today : day, minutes: 10 * 60 })}><Plus className="size-4" aria-hidden /> Nueva cita</Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-ink-soft">
        <label className="flex min-h-9 items-center gap-2"><input type="checkbox" className="size-4 accent-primary" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Mostrar canceladas</label>
        <Link href="/admin/ajustes/bloqueos" className="underline underline-offset-2 hover:text-ink">Gestionar bloqueos y vacaciones</Link>
        {(view === 'day' || view === 'week') ? <span>Arrastra para mover · tira del borde inferior para cambiar la duración · doble clic para crear · con teclado: Alt + flechas</span> : null}
      </div>

      {view === 'day' || view === 'week' ? (
        <TimeGrid days={days} today={today} appointments={shown} blocks={blocks} onOpen={(a) => setTarget({ kind: 'edit', appt: a })} onCreate={(d, m) => setTarget({ kind: 'create', day: d, minutes: m })} onMove={onMove} />
      ) : view === 'month' ? (
        <MonthGrid days={days} month={day.slice(0, 7)} today={today} appointments={shown} blocks={blocks} onOpen={(a) => setTarget({ kind: 'edit', appt: a })} onDay={(d) => go('day', d)} />
      ) : (
        <AgendaList appointments={shown} onOpen={(a) => setTarget({ kind: 'edit', appt: a })} />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        {undo ? (
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-night px-5 py-2 text-sm text-white shadow-lift [animation:toast-in_240ms_var(--ease-out-soft)]">
            <span>Cita de {undo.label} movida.</span>
            <button type="button" onClick={doUndo} className="min-h-9 rounded-full px-3 font-medium underline underline-offset-2 hover:bg-white/10">Deshacer</button>
          </div>
        ) : null}
      </div>

      <AppointmentDialog target={target} options={options} onClose={() => setTarget(null)} onSaved={saved} />
    </div>
  );
}
