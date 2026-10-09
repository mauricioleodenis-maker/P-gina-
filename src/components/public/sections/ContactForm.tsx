'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Button, Field, Input, Textarea } from '@/components/ui';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'consent' | 'form', string>>;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Formulario de contacto. Sin datos clinicos: aviso explicito. Honeypot + Turnstile + rate limit en el servidor. */
export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const form = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      message: String(fd.get('message') ?? ''),
      consent: fd.get('consent') === 'on',
      website: String(fd.get('website') ?? ''),
      turnstileToken: String(fd.get('cf-turnstile-response') ?? ''),
    };
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Errors; error?: string };
      if (res.ok && json.ok) {
        setState('sent');
        form.current?.reset();
        return;
      }
      setErrors(json.errors ?? { form: json.error ?? 'No se pudo enviar. Inténtalo de nuevo en unos minutos.' });
    } catch {
      setErrors({ form: 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.' });
    }
    setState('idle');
  }

  if (state === 'sent') {
    return (
      <div role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-6">
        <p className="font-serif text-2xl">Mensaje recibido</p>
        <p className="mt-2 text-ink-soft">Gracias. Te responderé en uno o dos días laborables.</p>
      </div>
    );
  }

  const d = (k: keyof Errors, id: string) => (errors[k] ? `${id}-error` : `${id}-hint`);

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="grid gap-5">
      <p className="rounded-md bg-surface p-4 text-sm text-ink-soft">
        Por privacidad, no escribas aquí datos clínicos ni detalles de tu situación. Basta con un motivo general; lo hablamos en la primera cita.
      </p>
      <Field id="c-name" label="Nombre" error={errors.name}>
        <Input id="c-name" name="name" autoComplete="name" required maxLength={120} aria-invalid={!!errors.name} aria-describedby={d('name', 'c-name')} />
      </Field>
      <Field id="c-email" label="Correo electrónico" error={errors.email}>
        <Input id="c-email" name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={!!errors.email} aria-describedby={d('email', 'c-email')} />
      </Field>
      <Field id="c-phone" label="Teléfono (opcional)" error={errors.phone}>
        <Input id="c-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} aria-invalid={!!errors.phone} aria-describedby={d('phone', 'c-phone')} />
      </Field>
      <Field id="c-message" label="Mensaje" hint="Sin datos clínicos, por favor." error={errors.message}>
        <Textarea id="c-message" name="message" required maxLength={2000} aria-invalid={!!errors.message} aria-describedby={d('message', 'c-message')} />
      </Field>
      {/* Honeypot: oculto a personas y lectores de pantalla */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>No rellenar<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {SITE_KEY ? <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="light" /> : null}
      <div className="flex flex-col gap-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="consent" required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'c-consent-error' : undefined} className="mt-1 size-5 shrink-0 accent-[#5f7a64]" />
          <span>
            He leído la <Link href="/privacidad" className="underline underline-offset-4">política de privacidad</Link> y acepto que se use mi mensaje para responderme.
          </span>
        </label>
        {errors.consent ? <p id="c-consent-error" role="alert" className="text-sm text-danger">{errors.consent}</p> : null}
      </div>
      {errors.form ? <p role="alert" className="text-sm text-danger">{errors.form}</p> : null}
      <div><Button type="submit" size="lg" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Enviar mensaje'}</Button></div>
      {SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" /> : null}
    </form>
  );
}
