import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export const fieldClass =
  'min-h-11 w-full rounded-md border border-sand bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink-soft/70 transition-colors duration-150 hover:border-ink-soft/50 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary aria-[invalid=true]:border-danger disabled:opacity-60';

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...p} />;
}
export function Textarea({ className, rows = 5, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(fieldClass, 'resize-y', className)} {...p} />;
}

/** Etiqueta + control + ayuda/error asociados por id. */
export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="text-sm text-ink-soft">{hint}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
