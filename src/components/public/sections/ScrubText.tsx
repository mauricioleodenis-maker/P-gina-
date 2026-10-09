'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced';

/**
 * Revelado palabra a palabra ligado al scroll. El texto completo es el contenido real
 * (legible sin JS); las palabras se atenuan solo cuando el JS marca data-scrub.
 */
export function ScrubText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-w]'));
    el.dataset.scrub = 'on';
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55 + r.height)));
      spans.forEach((s, i) => {
        const local = Math.min(1, Math.max(0, p * spans.length * 1.2 - i));
        s.style.setProperty('--wp', local.toFixed(2));
      });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
      delete el.dataset.scrub;
    };
  }, [reduced, text]);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} data-w style={{ opacity: 'calc(0.25 + 0.75 * var(--wp, 1))' }}>
          {w}{' '}
        </span>
      ))}
    </p>
  );
}
