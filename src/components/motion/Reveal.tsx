'use client';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useRevealState } from '@/lib/motion/use-reveal-state';

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** ms de retardo (stagger manual: índice * 100). */
  delay?: number;
  /** píxeles de desplazamiento vertical inicial. */
  y?: number;
  /** true para contenido above the fold: anima al montar. */
  immediate?: boolean;
  once?: boolean;
};

/** Revela su contenido al entrar en pantalla. Visible sin JS; fundido corto con reduced-motion. */
export function Reveal({ children, as: Tag = 'div', className, delay = 0, y = 24, immediate, once = true }: Props) {
  const { ref, state } = useRevealState<HTMLElement>({ immediate, once });
  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={state === 'idle' ? undefined : state}
      style={{ '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
