'use client';
import { useRef, type ReactNode } from 'react';
import { useFinePointer, useReducedMotion } from '@/lib/motion/reduced';

type Props = { children: ReactNode; className?: string; /** px máximos de atracción. */ strength?: number };

/** Envoltorio que atrae sutilmente a su contenido hacia el puntero (solo puntero fino, sin reduced-motion). */
export function MagneticButton({ children, className, strength = 8 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || !enabled) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.transform = `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px, 0)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };

  return (
    <span
      ref={ref}
      data-motion="magnetic"
      className={`inline-block transition-transform duration-300 ease-[var(--ease-out-soft)] ${className ?? ''}`}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </span>
  );
}
