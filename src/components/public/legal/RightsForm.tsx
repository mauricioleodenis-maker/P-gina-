'use client';
import { useActionState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Button, Field, Input, fieldClass } from '@/components/ui';
import { submitDataRequest, type RightsState } from '@/app/(public)/privacidad/derechos/actions';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const initial: RightsState = { ok: false };

const TYPES = [
  ['access', 'Acceso a mis datos'],
  ['rectification', 'Rectificación'],
  ['erasure', 'Supresión'],
  ['objection', 'Oposición'],
  ['restriction', 'Limitación del tratamiento'],
  ['portability', 'Portabilidad'],
  ['withdrawal', 'Retirar un consentimiento'],
] as const;

export function RightsForm() {
  const [state, action, pending] = useActionState(submitDataRequest, initial);
  const e = state.errors ?? {};

  if (state.ok) {
    return (
      <div role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-6">
        <p className="font-serif text-2xl">Solicitud recibida</p>
        <p className="mt-2 text-ink-soft">Responderé en el plazo máximo de un mes. Si necesito verificar tu identidad, te lo pediré por correo.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5">
      <p className="rounded-md bg-surface p-4 text-sm text-ink-soft">
        No incluyas datos clínicos en este formulario. Solo necesito saber quién eres y qué derecho quieres ejercer.
      </p>
      <Field id="r-name" label="Nombre y apellidos" error={e.name}>
        <Input id="r-name" name="name" autoComplete="name" required maxLength={120} aria-invalid={!!e.name} aria-describedby={e.name ? 'r-name-error' : undefined} />
      </Field>
      <Field id="r-email" label="Correo electrónico" error={e.email}>
        <Input id="r-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={!!e.email} aria-describedby={e.email ? 'r-email-error' : undefined} />
      </Field>
      <Field id="r-type" label="Derecho que quieres ejercer" error={e.type}>
        <select id="r-type" name="type" required defaultValue="" className={fieldClass} aria-invalid={!!e.type} aria-describedby={e.type ? 'r-type-error' : undefined}>
          <option value="" disabled>Elige una opción</option>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>No rellenar<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {SITE_KEY ? <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="light" /> : null}
      <div className="flex flex-col gap-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required aria-invalid={!!e.consent} aria-describedby={e.consent ? 'r-consent-error' : undefined} className="mt-1 size-5 shrink-0 accent-[#5f7a64]" />
          <span>He leído la <Link href="/privacidad" className="underline underline-offset-4">política de privacidad</Link> y acepto que se traten estos datos para gestionar mi solicitud.</span>
        </label>
        {e.consent ? <p id="r-consent-error" role="alert" className="text-sm text-danger">{e.consent}</p> : null}
      </div>
      {state.formError ? <p role="alert" className="text-sm text-danger">{state.formError}</p> : null}
      <div><Button type="submit" size="lg" disabled={pending}>{pending ? 'Enviando…' : 'Enviar solicitud'}</Button></div>
      {SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" /> : null}
    </form>
  );
}
