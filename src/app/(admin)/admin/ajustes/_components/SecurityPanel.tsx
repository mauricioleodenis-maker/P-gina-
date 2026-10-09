'use client';
import { useActionState, useState, useTransition } from 'react';
import { Button, Field, Input, useToast } from '@/components/ui';
import {
  changePasswordAction,
  regenerateRecoveryCodesAction,
  signOutOtherSessionsAction,
} from '@/modules/auth/actions';
import { FormError, SubmitButton, useSaveFeedback } from './FormParts';

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  useSaveFeedback(state, 'Contrasena actualizada');
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid max-w-md gap-4" noValidate>
      <Field id="pw" label="Nueva contrasena" hint="Minimo 12 caracteres. Se comprueba contra filtraciones conocidas." error={e.password}>
        <Input id="pw" name="password" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field id="pw2" label="Repetir contrasena" error={e.confirm}>
        <Input id="pw2" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <FormError state={state} />
      <div><SubmitButton pending={pending}>Cambiar contrasena</SubmitButton></div>
    </form>
  );
}

export function RecoveryCodesPanel({ remaining }: { remaining: number }) {
  const { toast } = useToast();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  function regen() {
    if (!window.confirm('Los codigos anteriores dejaran de funcionar. Continuar?')) return;
    start(async () => {
      const r = await regenerateRecoveryCodesAction();
      if (r.ok && r.data) setCodes(r.data.codes);
      else toast({ title: r.ok ? 'Error' : r.error, tone: 'danger' });
    });
  }
  return (
    <div className="grid gap-4">
      <p>Codigos de recuperacion disponibles: <strong className="tabular">{remaining}</strong></p>
      {remaining <= 3 ? <p className="text-sm text-warn">Quedan pocos codigos. Genera un juego nuevo.</p> : null}
      {codes ? (
        <>
          <p className="text-sm text-ink-soft">Guardalos ahora: no se volveran a mostrar.</p>
          <ul className="tabular grid max-w-sm grid-cols-2 gap-2 rounded-md bg-white p-4 text-center font-mono" aria-label="Codigos de recuperacion">
            {codes.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </>
      ) : null}
      <div><Button variant="secondary" onClick={regen} disabled={pending}>Generar codigos nuevos</Button></div>
    </div>
  );
}

export function SessionsPanel() {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-3">
      <p className="text-ink-soft">Cierra la sesion en cualquier otro dispositivo. Esta sesion se mantiene. La sesion caduca sola tras 30 minutos de inactividad.</p>
      <div>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => start(async () => {
            const r = await signOutOtherSessionsAction();
            toast(r.ok ? { title: 'Otras sesiones cerradas', tone: 'ok' } : { title: r.error, tone: 'danger' });
          })}
        >Cerrar otras sesiones</Button>
      </div>
    </div>
  );
}
