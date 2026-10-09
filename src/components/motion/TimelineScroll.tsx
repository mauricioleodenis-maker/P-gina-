'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced';

export type TimelineStep = { title: string; body: ReactNode };

/**
 * Línea de tiempo vertical que se dibuja con el scroll; cada paso se ilumina al alcanzarse.
 * Sin JS o con reduced-motion todo está dibujado e iluminado.
 */
export function TimelineScroll({ steps, className = '' }: { steps: TimelineStep[]; className?: string }) {
  const wrap = useRef<HTMLOListElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState<number>(steps.length); // todo activo por defecto

  useEffect(() => {
    const el = wrap.current;
    const ln = line.current;
    if (!el || !ln) return;
    if (reduced) {
      ln.style.transform = 'scaleY(1)';
      setActive(steps.length);
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      ln.style.transform = `scaleY(${p.toFixed(3)})`;
      setActive(Math.ceil(p * steps.length - 0.15));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, steps.length]);

  return (
    <ol ref={wrap} className={`relative ${className}`}>
      <span aria-hidden className="absolute bottom-2 left-[19px] top-2 w-px bg-sand" />
      <span
        ref={line}
        aria-hidden
        className="absolute bottom-2 left-[19px] top-2 w-px origin-top bg-primary"
        style={{ transform: 'scaleY(1)' }}
      />
      {steps.map((s, i) => {
        const on = i < active;
        return (
          <li key={s.title} className="relative flex gap-6 pb-14 last:pb-0" data-active={on}>
            <span
              aria-hidden
              className={`z-10 grid size-10 shrink-0 place-items-center rounded-full border text-sm tabular transition-colors duration-500 ${
                on ? 'border-primary bg-primary text-primary-ink' : 'border-sand bg-bg text-ink-soft'
              }`}
            >
              {i + 1}
            </span>
            <div className={`pt-1 transition-opacity duration-500 ${on ? 'opacity-100' : 'opacity-75'}`}>
              <h3 className="font-serif text-2xl">{s.title}</h3>
              <div className="mt-2 measure text-ink-soft">{s.body}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
