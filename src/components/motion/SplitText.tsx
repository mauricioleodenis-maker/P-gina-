'use client';
import type { CSSProperties, ElementType } from 'react';
import { useRevealState } from '@/lib/motion/use-reveal-state';

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Palabras (sin puntuación) que se muestran en cursiva de acento. Una por titular. */
  accent?: string[];
  immediate?: boolean;
  /** ms antes de empezar. */
  delay?: number;
};

/**
 * Titular con revelado por palabras con máscara. El texto completo es accesible
 * (aria-label en el contenedor, palabras aria-hidden) y visible sin JS.
 */
export function SplitText({ text, as: Tag = 'h2', className, accent = [], immediate, delay = 0 }: Props) {
  const { ref, state } = useRevealState<HTMLElement>({ immediate });
  const words = text.split(/\s+/).filter(Boolean);
  const accentSet = new Set(accent.map((w) => w.toLowerCase()));
  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={text}
      data-split={state === 'idle' ? undefined : state}
      style={{ '--split-delay': `${delay}ms` } as CSSProperties}
    >
      {words.map((w, i) => {
        const clean = w.replace(/[.,;:!?¿¡"“”]/g, '').toLowerCase();
        return (
          <span key={`${w}-${i}`} aria-hidden="true">
            <span data-split-word style={{ '--i': i } as CSSProperties}>
              <span className={accentSet.has(clean) ? 'accent-italic' : undefined}>{w}</span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </span>
        );
      })}
    </Tag>
  );
}
