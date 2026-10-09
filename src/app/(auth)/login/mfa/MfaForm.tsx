'use client';
import { useActionState, useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { recoveryAction, signOutAction, verifyMfaAction } from '@/modules/auth/actions';
import type { FormState } from '@/modules/auth/types';

const initial: FormState = {};

export function MfaForm({ next }: { next?: string }) {
  const [recovery, setRecovery] = useState(false);
  const [state, action, pending] = useActionState(recovery ? recoveryAction : verifyMfaAction, initial);
  return (
    <div className="grid gap-5">
      <form action={action} className="grid gap-5" noValidate key={recovery ? 'r' : 't'}>
        <h1 className="font-serif text-2xl text-ink">{recovery ? 'Codigo de recuperacion' : 'Verificacion en dos pasos'}</h1>
        <p className="text-ink-soft">
          {recovery
            ? 'Usa uno de tus codigos de un solo uso. Tendras que volver a configurar la app de autenticacion.'
            : 'Introduce el codigo de 6 digitos de tu app de autenticacion.'}
        </p>
        <input type="hidden" name="next" value={next ?? ''} />
        <Field id="code" label={recovery ? 'Codigo (XXXXX-XXXXX)' : 'Codigo de 6 digitos'} error={state.fieldErrors?.code}>
          <Input
            id="code"
            name="code"
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode={recovery ? 'text' : 'numeric'}
            pattern={recovery ? undefined : '[0-9]{6}'}
            maxLength={recovery ? 11 : 6}
            className="tabular text-center text-xl tracking-widest"
            aria-invalid={!!state.fieldErrors?.code}
          />
        </Field>
        {state.error ? <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p> : null}
        <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Verificando...' : 'Verificar'}</Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" onClick={() => setRecovery((v) => !v)} className="min-h-11 text-primary-strong underline underline-offset-4">
          {recovery ? 'Usar la app de autenticacion' : 'Usar un codigo de recuperacion'}
        </button>
        <form action={signOutAction.bind(null, undefined)}>
          <button type="submit" className="min-h-11 text-ink-soft underline underline-offset-4">Cancelar</button>
        </form>
      </div>
    </div>
  );
}
