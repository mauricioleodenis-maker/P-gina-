'use client';
import { useActionState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { signInAction } from '@/modules/auth/actions';
import type { FormState } from '@/modules/auth/types';
import { Turnstile } from './Turnstile';

const initial: FormState = {};

export function LoginForm({ next, notice, siteKey, nonce }: { next?: string; notice?: string; siteKey?: string; nonce?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} className="grid gap-5" noValidate>
      <h1 className="font-serif text-2xl text-ink">Iniciar sesion</h1>
      {notice && !state.error ? (
        <p role="status" className="rounded-md bg-warn/15 px-4 py-3 text-sm text-ink">{notice}</p>
      ) : null}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field id="email" label="Correo electronico" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="username" required aria-invalid={!!state.fieldErrors?.email} />
      </Field>
      <Field id="password" label="Contrasena" error={state.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state.fieldErrors?.password} />
      </Field>
      {state.needsCaptcha && siteKey ? <Turnstile siteKey={siteKey} nonce={nonce} /> : null}
      {state.error ? <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{state.error}</p> : null}
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? 'Comprobando...' : 'Entrar'}</Button>
    </form>
  );
}
