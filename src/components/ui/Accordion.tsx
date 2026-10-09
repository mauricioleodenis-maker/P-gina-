'use client';
import * as RA from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type AccordionEntry = { id: string; title: string; content: ReactNode };

/** Acordeón accesible con altura animada (CSS sobre --radix-accordion-content-height). */
export function Accordion({ items, type = 'single', className }: { items: AccordionEntry[]; type?: 'single' | 'multiple'; className?: string }) {
  const props = type === 'single' ? ({ type: 'single', collapsible: true } as const) : ({ type: 'multiple' } as const);
  return (
    <RA.Root {...props} className={cn('divide-y divide-sand border-y border-sand', className)}>
      {items.map((it) => (
        <RA.Item key={it.id} value={it.id}>
          <RA.Header>
            <RA.Trigger className="group flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-serif text-xl transition-colors hover:text-primary-strong">
              {it.title}
              <ChevronDown className="size-5 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden />
            </RA.Trigger>
          </RA.Header>
          <RA.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pb-5 measure text-ink-soft">{it.content}</div>
          </RA.Content>
        </RA.Item>
      ))}
    </RA.Root>
  );
}
