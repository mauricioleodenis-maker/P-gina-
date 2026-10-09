'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/components/ui/cn';

type Props = {
  label: string;
  /** Valor numerico para contar. Si es null y `failed`, se muestra el error. */
  value?: number | null;
  /** Formateo del valor (p. ej. euros). Por defecto entero es-ES. */
  format?: (n: number) => string;
  hint?: ReactNode;
  failed?: boolean;
  /** Tendencia: porcentaje frente al periodo anterior. */
  trendPct?: number | null;
  href?: string;
};

const defaultFormat = (n: number) => n.toLocaleString('es-ES');

/** Conteo breve (<= 700 ms) una sola vez; con reduced-motion muestra el valor final. */
function useCountUp(target: number, duration = 700) {
  const [v, setV] = useState(target);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || target === 0) return;
    done.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const t0 = performance.now();
    setV(0);
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function KpiCard({ label, value, format = defaultFormat, hint, failed, trendPct, href }: Props) {
  const shown = useCountUp(value ?? 0);
  const body = (
    <Card className={cn('h-full p-5', href && 'transition-colors duration-150 hover:bg-sand/30')}>
      <p className="text-sm text-ink-soft">{label}</p>
      {failed || value == null ? (
        <p className="mt-2 text-sm text-danger" role="alert">No disponible</p>
      ) : (
        <p className="mt-1 font-serif text-4xl tabular" aria-label={`${label}: ${format(value)}`}>
          <span aria-hidden="true">{format(shown)}</span>
        </p>
      )}
      {trendPct != null && !failed ? (
        <p className={cn('mt-1 text-sm tabular', trendPct >= 0 ? 'text-ok' : 'text-danger')}>
          {trendPct >= 0 ? '+' : ''}{trendPct} % vs. mes anterior
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-sm text-ink-soft">{hint}</p> : null}
    </Card>
  );
  return href ? (
    <a href={href} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      {body}
    </a>
  ) : (
    body
  );
}
