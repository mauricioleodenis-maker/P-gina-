'use client';
import * as RS from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from './cn';
import { fieldClass } from './Input';

export type SelectOption = { value: string; label: string };
type Props = {
  options: SelectOption[];
  value?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
};

export function Select({ options, placeholder = 'Elegir', className, id, ...rest }: Props) {
  return (
    <RS.Root {...rest}>
      <RS.Trigger id={id} aria-label={rest['aria-label']} className={cn(fieldClass, 'flex items-center justify-between gap-2 text-left data-[placeholder]:text-ink-soft/70', className)}>
        <RS.Value placeholder={placeholder} />
        <RS.Icon><ChevronDown className="size-4" aria-hidden /></RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content position="popper" sideOffset={6} className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-sand bg-bg shadow-lift">
          <RS.Viewport className="p-1">
            {options.map((o) => (
              <RS.Item key={o.value} value={o.value} className="relative flex min-h-11 cursor-pointer select-none items-center rounded-sm py-2 pl-9 pr-3 outline-none data-[highlighted]:bg-surface">
                <RS.ItemIndicator className="absolute left-3"><Check className="size-4 text-primary" aria-hidden /></RS.ItemIndicator>
                <RS.ItemText>{o.label}</RS.ItemText>
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
