'use client';
import { useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';

type Props = { children: ReactNode; className?: string; label?: string };

/** Cinta de texto en bucle, pausable (WCAG 2.2.2). Estática con reduced-motion. */
export function Marquee({ children, className = '', label = 'Frases en movimiento' }: Props) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`relative flex items-center gap-3 ${className}`} role="group" aria-label={label}>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          data-motion="marquee"
          className="flex w-max animate-marquee gap-12 whitespace-nowrap"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
        >
          <div className="flex gap-12">{children}</div>
          <div className="flex gap-12" aria-hidden="true">{children}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'Reanudar movimiento' : 'Pausar movimiento'}
        aria-pressed={paused}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-sand text-ink-soft transition-colors hover:bg-surface"
      >
        {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
