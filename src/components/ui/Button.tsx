import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

export const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,box-shadow] duration-150 ease-[var(--ease-calm)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-ink hover:bg-primary-strong',
        secondary: 'border border-sand bg-transparent text-ink hover:bg-surface',
        ghost: 'text-ink hover:bg-surface',
        accent: 'bg-accent-strong text-white hover:bg-[#8f5a3e]',
        danger: 'bg-danger text-white hover:bg-[#962f2f]',
      },
      size: { sm: 'px-4 text-sm', md: 'px-6 text-base', lg: 'min-h-14 px-8 text-lg' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & Variants) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ className, variant, size, href, ...props }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & Variants & { href: string }) {
  return <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
