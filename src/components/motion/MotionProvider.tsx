'use client';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { LenisProvider } from './LenisProvider';

/** MotionConfig reducedMotion="user" + Lenis. Envuelve solo la web pública. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.26, ease: [0.2, 0, 0, 1] }}>
      <LenisProvider>{children}</LenisProvider>
    </MotionConfig>
  );
}
