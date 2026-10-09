import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from './cn';

export function Table({ className, caption, children, ...p }: HTMLAttributes<HTMLTableElement> & { caption?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-sand">
      <table className={cn('w-full border-collapse text-left', className)} {...p}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}
export const THead = (p: HTMLAttributes<HTMLTableSectionElement>) => <thead className="bg-surface text-sm text-ink-soft" {...p} />;
export const TBody = (p: HTMLAttributes<HTMLTableSectionElement>) => <tbody className="divide-y divide-sand/70" {...p} />;
export const TR = ({ className, ...p }: HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('transition-colors hover:bg-surface/60', className)} {...p} />;
export const TH = ({ className, ...p }: ThHTMLAttributes<HTMLTableCellElement>) => <th scope="col" className={cn('px-4 py-3 font-medium', className)} {...p} />;
export const TD = ({ className, numeric, ...p }: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) => (
  <td className={cn('px-4 py-3', numeric && 'text-right tabular', className)} {...p} />
);
