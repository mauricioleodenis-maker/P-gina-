'use client';
import { REDUCED_QUERY } from './tokens';

/**
 * Carga GSAP + ScrollTrigger bajo demanda (no entra en el JS inicial).
 * Usar siempre con `withMotion` para respetar prefers-reduced-motion.
 */
export async function loadGsap() {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

/**
 * Ejecuta `setup` solo cuando NO hay reduced-motion (gsap.matchMedia) y limpia al desmontar.
 * `onReduced` recibe el estado final sin animación (por defecto, nada: el contenido ya es visible).
 */
export async function withMotion(
  setup: (ctx: Awaited<ReturnType<typeof loadGsap>>) => void | (() => void),
  onReduced?: () => void,
): Promise<() => void> {
  const g = await loadGsap();
  const mm = g.gsap.matchMedia();
  mm.add({ ok: `(prefers-reduced-motion: no-preference)`, reduce: REDUCED_QUERY }, (ctx) => {
    if (ctx.conditions?.reduce) {
      onReduced?.();
      return;
    }
    return setup(g);
  });
  return () => mm.revert();
}
