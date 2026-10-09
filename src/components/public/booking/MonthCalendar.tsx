'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/components/ui';

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (k: string) => ({ y: Number(k.slice(0, 4)), m: Number(k.slice(5, 7)) - 1, d: Number(k.slice(8, 10)) });
const shift = (k: string, days: number) => {
  const { y, m, d } = parse(k);
  const t = new Date(Date.UTC(y, m, d + days));
  return key(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
};

type Props = {
  /** Mes visible, "yyyy-MM". */
  month: string;
  onMonthChange: (month: string) => void;
  /** Dias ("yyyy-MM-dd") con huecos libres. */
  available: ReadonlySet<string>;
  selected: string | null;
  onSelect: (day: string) => void;
  loading?: boolean;
  /** Primer y ultimo mes navegables, "yyyy-MM". */
  minMonth: string;
  maxMonth: string;
};

/**
 * Calendario mensual como rejilla ARIA: flechas mueven el foco, Inicio/Fin = lunes/domingo,
 * RePag/AvPag cambian de mes, Intro/Espacio selecciona. Los dias sin hueco se anuncian como no disponibles.
 */
export function MonthCalendar({ month, onMonthChange, available, selected, onSelect, loading, minMonth, maxMonth }: Props) {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7)) - 1;
  const first = new Date(Date.UTC(y, m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const [focus, setFocus] = useState<string>(selected && selected.startsWith(month) ? selected : key(y, m, 1));
  const gridRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);

  useEffect(() => {
    if (!focus.startsWith(month)) setFocus(key(y, m, 1));
  }, [month, focus, y, m]);

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus();
  }, [focus, month]);

  const cells = useMemo(() => {
    const out: Array<string | null> = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(key(y, m, d));
    while (out.length % 7) out.push(null);
    return out;
  }, [lead, daysInMonth, y, m]);

  const prevMonth = m === 0 ? `${y - 1}-12` : `${y}-${pad(m)}`;
  const nextMonth = m === 11 ? `${y + 1}-01` : `${y}-${pad(m + 2)}`;
  const canPrev = prevMonth >= minMonth;
  const canNext = nextMonth <= maxMonth;

  function move(next: string) {
    const nm = next.slice(0, 7);
    if (nm < minMonth || nm > maxMonth) return;
    wantFocus.current = true;
    setFocus(next);
    if (nm !== month) onMonthChange(nm);
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, day: string) {
    const col = (parse(day).d + lead - 1) % 7;
    const map: Record<string, string | undefined> = {
      ArrowLeft: shift(day, -1),
      ArrowRight: shift(day, 1),
      ArrowUp: shift(day, -7),
      ArrowDown: shift(day, 7),
      Home: shift(day, -col),
      End: shift(day, 6 - col),
      PageUp: shift(day, -30),
      PageDown: shift(day, 30),
    };
    const next = map[e.key];
    if (next) {
      e.preventDefault();
      move(next);
    }
  }

  return (
    <div className="rounded-lg border border-sand bg-white p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(prevMonth)}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="grid size-11 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        <h3 id="cal-title" aria-live="polite" className="font-serif text-xl capitalize">
          {MONTHS[m]} {y}
        </h3>
        <button
          type="button"
          onClick={() => onMonthChange(nextMonth)}
          disabled={!canNext}
          aria-label="Mes siguiente"
          className="grid size-11 place-items-center rounded-full hover:bg-surface disabled:opacity-30"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>

      <div role="grid" aria-labelledby="cal-title" aria-busy={loading} ref={gridRef} className="select-none">
        <div role="row" className="mb-1 grid grid-cols-7 text-center text-sm text-ink-soft">
          {SHORT.map((s, i) => (
            <div key={s} role="columnheader" aria-label={WEEKDAYS[i]} className="py-1">{s}</div>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <div role="row" key={r} className="grid grid-cols-7">
            {cells.slice(r * 7, r * 7 + 7).map((day, c) => {
              if (!day) return <div role="gridcell" key={c} aria-hidden="true" />;
              const { d } = parse(day);
              const isAvail = available.has(day);
              const isSel = selected === day;
              return (
                <div role="gridcell" key={day} aria-selected={isSel} className="flex justify-center p-0.5">
                  <button
                    type="button"
                    data-day={day}
                    tabIndex={focus === day ? 0 : -1}
                    aria-disabled={!isAvail}
                    aria-label={`${d} de ${MONTHS[m]}, ${isAvail ? 'hay horas disponibles' : 'sin horas disponibles'}`}
                    onKeyDown={(e) => onKey(e, day)}
                    onFocus={() => setFocus(day)}
                    onClick={() => isAvail && onSelect(day)}
                    className={cn(
                      'grid size-11 place-items-center rounded-full text-base tabular-nums transition-colors duration-150',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      isSel ? 'bg-primary text-primary-ink' : isAvail ? 'font-medium text-ink hover:bg-surface' : 'cursor-default text-ink-soft/50',
                    )}
                  >
                    {d}
                    {isAvail && !isSel ? <span aria-hidden className="absolute mt-7 size-1 rounded-full bg-accent" /> : null}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft" role="status">
        {loading ? 'Buscando horas libres…' : 'Los días con un punto tienen horas libres. Hora de Madrid.'}
      </p>
    </div>
  );
}
