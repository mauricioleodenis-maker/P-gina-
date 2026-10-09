'use client';
import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

type Props = { title: string; description?: string; children: ReactNode; className?: string; side?: 'center' | 'right' };

export function DialogContent({ title, description, children, className, side = 'center' }: Props) {
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-50 bg-night/50 [animation:fade-in_220ms_ease-out]" />
      <RD.Content
        className={cn(
          'fixed z-50 bg-bg shadow-lift outline-none',
          side === 'center'
            ? 'left-1/2 top-1/2 max-h-[88vh] w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl p-6 [animation:dialog-in_240ms_var(--ease-out-soft)]'
            : 'inset-y-0 right-0 w-[min(88vw,22rem)] overflow-auto p-6 [animation:drawer-in_300ms_var(--ease-out-soft)]',
          className,
        )}
      >
        <RD.Title className="font-serif text-2xl">{title}</RD.Title>
        {description ? <RD.Description className="mt-1 text-ink-soft">{description}</RD.Description> : <RD.Description className="sr-only">{title}</RD.Description>}
        <div className="mt-4">{children}</div>
        <RD.Close aria-label="Cerrar" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full hover:bg-surface">
          <X className="size-5" aria-hidden />
        </RD.Close>
      </RD.Content>
    </RD.Portal>
  );
}
