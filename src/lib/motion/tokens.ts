/** Duraciones (s) y easings del brief 07 s.5. Cuanto más se repite, más corto. */
export const duration = { hover: 0.15, ui: 0.26, reveal: 0.8, route: 0.42, reduced: 0.15 } as const;
export const ease = {
  calm: [0.2, 0, 0, 1] as const,
  outSoft: [0.22, 1, 0.36, 1] as const,
};
export const stagger = 0.1;
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
