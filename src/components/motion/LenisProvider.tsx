'use client';
import { useEffect, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced';

/** Scroll suave (Lenis) solo en la web pública, con puntero preciso o táctil, nunca con reduced-motion. */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 3), anchors: true });
      const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    });
    return () => { cancelled = true; if (raf) cancelAnimationFrame(raf); destroy?.(); };
  }, [reduced]);
  return <>{children}</>;
}
