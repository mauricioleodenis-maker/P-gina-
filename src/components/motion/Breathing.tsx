'use client';
import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

/** Círculo que respira (4-6 s). Decorativo, pausable; estático con reduced-motion. */
export function Breathing({ className = '', size = 220, withControl = true }: { className?: string; size?: number; withControl?: boolean }) {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <span
        aria-hidden
        data-motion="breathe"
        className="absolute inset-0 animate-breathe rounded-full bg-primary/25"
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      />
      <span aria-hidden className="absolute inset-[22%] rounded-full bg-primary/30" />
      <span aria-hidden className="absolute inset-[40%] rounded-full bg-accent/40" />
      {withControl && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? 'Reanudar la animación de respiración' : 'Pausar la animación de respiración'}
          className="absolute -bottom-3 right-0 grid size-11 place-items-center rounded-full border border-sand bg-bg text-ink-soft hover:bg-surface"
        >
          {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
        </button>
      )}
    </div>
  );
}
