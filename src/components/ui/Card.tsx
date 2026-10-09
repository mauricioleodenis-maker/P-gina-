import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-sand/70 bg-surface p-6 shadow-soft', className)} {...p} />;
}
export function CardTitle({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-serif text-2xl', className)} {...p} />;
}
export function CardBody({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-2 text-ink-soft', className)} {...p} />;
}
