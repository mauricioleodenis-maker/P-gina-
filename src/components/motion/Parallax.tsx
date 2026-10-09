'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced';

type Props = { children: ReactNode; className?: string; /** px máximos (<=40 recomendado). */ distance?: number };

/** Desplazamiento vertical leve ligado al scroll (transform). Desactivado con reduced-motion. */
export function Parallax({ children, className, distance = 32 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const max = Math.min(distance, 40);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight; // -1..1 aprox
      el.style.transform = `translate3d(0, ${(-p * max).toFixed(1)}px, 0)`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [distance, reduced]);

  return (
    <div ref={ref} className={className} data-motion="parallax" style={{ willChange: reduced ? undefined : 'transform' }}>
      {children}
    </div>
  );
}
