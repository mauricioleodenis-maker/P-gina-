'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from './reduced';

export type RevealState = 'idle' | 'hidden' | 'shown';
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Estado de revelado con mejora progresiva: en servidor y sin JS el contenido es visible ('idle').
 * Tras hidratar, si el elemento aún no está en pantalla se oculta y se muestra al entrar.
 * Con `immediate` (above the fold) se oculta antes de pintar y se revela en el siguiente frame.
 * Con reduced-motion el CSS reduce a fundido corto.
 */
export function useRevealState<T extends Element>(opts: { immediate?: boolean; once?: boolean; margin?: string } = {}) {
  const { immediate = false, once = true, margin = '0px 0px -12% 0px' } = opts;
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>('idle');
  const reduced = useReducedMotion();

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inView = el.getBoundingClientRect().top < window.innerHeight * 0.92;
    if (inView && !immediate) return; // ya visible al cargar: no parpadear
    setState('hidden');
    if (immediate) {
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setState('shown')));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setState('shown');
            if (once) io.disconnect();
          } else if (!once) setState('hidden');
        }
      },
      { rootMargin: margin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate, once, margin]);

  return { ref, state, reduced };
}
