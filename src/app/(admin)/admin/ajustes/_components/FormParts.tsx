'use client';
import { useEffect, useRef } from 'react';
import { Button, useToast } from '@/components/ui';
import type { FormState } from '@/modules/auth/types';

/** Mensaje de error del formulario + toast al guardar. */
export function useSaveFeedback(state: FormState, okMessage = 'Cambios guardados') {
  const { toast } = useToast();
  const seen = useRef<FormState | null>(null);
  useEffect(() => {
    if (state.ok && seen.current !== state) toast({ title: okMessage, tone: 'ok' });
    seen.current = state;
  }, [state, okMessage, toast]);
}

export function FormError({ state }: { state: FormState }) {
  return state.error ? (
    <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p>
  ) : null;
}

export function SubmitButton({ pending, children = 'Guardar cambios' }: { pending: boolean; children?: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? 'Guardando...' : children}
    </Button>
  );
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-sand/70 bg-surface p-5 shadow-soft sm:p-6">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-ink-soft">{hint}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
