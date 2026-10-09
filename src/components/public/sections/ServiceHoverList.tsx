'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useFinePointer, useReducedMotion } from '@/lib/motion/reduced';
import { modalityLabel, type ServiceItem } from '@/content/services';
import { priceLabel } from './price';

/**
 * Lista editorial. Con puntero fino, una forma orgánica sigue al cursor sobre la fila (decorativa).
 * En tactil/teclado queda como lista de enlaces (sin dependencia del hover).
 */
export function ServiceHoverList({ services }: { services: ServiceItem[] }) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const blob = useRef<HTMLSpanElement>(null);
  const enabled = fine && !reduced;

  const move = (e: React.PointerEvent<HTMLUListElement>) => {
    const b = blob.current;
    if (!b || !enabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    b.style.transform = `translate3d(${e.clientX - r.left + 24}px, ${e.clientY - r.top - 60}px, 0)`;
  };

  return (
    <ul className="group/list relative border-y border-sand" onPointerMove={move}>
      {enabled && (
        <span
          ref={blob}
          aria-hidden
          data-motion="parallax"
          className="pointer-events-none absolute left-0 top-0 z-10 hidden h-28 w-24 rounded-t-full rounded-b-lg bg-accent/30 opacity-0 transition-opacity duration-300 group-hover/list:opacity-100 md:block"
        />
      )}
      {services.map((s) => (
        <li key={s.slug} className="border-b border-sand last:border-b-0">
          <Link
            href={`/servicios/${s.slug}`}
            className="group flex min-h-24 flex-col gap-2 py-6 transition-colors duration-150 hover:text-primary-strong md:flex-row md:items-center md:justify-between md:gap-8"
          >
            <span className="font-serif text-3xl md:text-4xl">{s.name}</span>
            <span className="max-w-md text-ink-soft md:text-right">{s.short}</span>
            <span className="flex items-center gap-3 text-sm text-ink-soft">
              {modalityLabel[s.modality]} · {s.durationMin} min · <span className="tabular">{priceLabel(s.priceCents)}</span>
              <ArrowUpRight className="size-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
