'use client';
import { useRevealState } from '@/lib/motion/use-reveal-state';

/** Trazo orgánico SVG que se dibuja al entrar (stroke-dashoffset). Decorativo. */
export function DrawLine({ className = '', d = 'M4 60 C 60 10, 120 110, 190 55 S 300 20, 396 70', immediate }: { className?: string; d?: string; immediate?: boolean }) {
  const { ref, state } = useRevealState<SVGSVGElement>({ immediate });
  return (
    <svg
      ref={ref}
      viewBox="0 0 400 120"
      preserveAspectRatio="xMinYMid meet"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-draw={state === 'idle' ? undefined : state}
    >
      <path d={d} pathLength={1} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
