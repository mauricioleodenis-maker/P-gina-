import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

const badge = cva('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium', {
  variants: {
    tone: {
      neutral: 'bg-sand/60 text-ink',
      primary: 'bg-primary/15 text-primary-strong',
      accent: 'bg-accent/20 text-accent-strong',
      ok: 'bg-ok/15 text-ok',
      warn: 'bg-warn/15 text-[#8a5a12]',
      danger: 'bg-danger/15 text-danger',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({ className, tone, ...p }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...p} />;
}
