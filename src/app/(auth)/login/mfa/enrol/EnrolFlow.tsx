'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@/components/ui';
import { confirmEnrolAction, startEnrolAction, type EnrolStart } from '@/modules/auth/actions';

export function EnrolFlow({ recovered, next }: { recovered?: boolean; next: string }) {
  const router = useRouter();
  const [start, setStart] = useState<EnrolStart | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const began = useRef(false);

  useEffect(() => {
    if (began.current) return;
    began.current = true;
    startEnrolAction().then((r) => (r.ok && r.data ? setStart(r.data) : setError(r.ok ? undefined : r.error)));
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!start) return;
    const code = String(new FormData(e.currentTarget).get('code') ?? '');
    startTransition(async () => {
      const r = await confirmEnrolAction(start.factorId, code);
      if (r.ok && r.data) setCodes(r.data.codes);
      else setError(r.ok ? undefined : r.fieldErrors?.code ?? r.error);
    });
  }

  if (codes) {
    return (
      <div className="grid gap-5">
        <h1 className="font-serif text-2xl text-ink">Guarda tus codigos de recuperacion</h1>
        <p className="text-ink-soft">
          Cada codigo sirve una sola vez si pierdes el movil. No se volveran a mostrar. Guardalos en un gestor de contrasenas o impresos, fuera de este dispositivo.
        </p>
        <ul className="tabular grid grid-cols-2 gap-2 rounded-md bg-white p-4 text-center font-mono text-lg" aria-label="Codigos de recuperacion">
          {codes.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard?.writeText(codes.join('\n'))}>Copiar</Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>Imprimir</Button>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          He guardado los codigos en un lugar seguro
        </label>
        <Button disabled={!saved} onClick={() => router.replace(next)}>Continuar al panel</Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <h1 className="font-serif text-2xl text-ink">Configura la verificacion en dos pasos</h1>
      {recovered ? (
        <p role="status" className="rounded-md bg-warn/15 px-4 py-3 text-sm">Has usado un codigo de recuperacion: configura de nuevo tu app de autenticacion.</p>
      ) : (
        <p className="text-ink-soft">Es obligatoria: protege los datos de salud de tus pacientes.</p>
      )}
      <ol className="grid gap-4 text-ink-soft">
        <li>1. Abre una app de autenticacion (Aegis, 2FAS, Google Authenticator...) y escanea el QR.</li>
        {start ? (
          <li className="grid justify-items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={start.qr} alt="Codigo QR para la app de autenticacion" width={176} height={176} className="rounded-md bg-white p-2" />
            <details className="text-sm">
              <summary className="min-h-11 cursor-pointer leading-[2.75rem] underline underline-offset-4">No puedo escanear</summary>
              <p className="mt-1 break-all font-mono text-ink">{start.secret}</p>
            </details>
          </li>
        ) : (
          <li aria-live="polite">{error ? null : 'Preparando codigo QR...'}</li>
        )}
        <li>2. Escribe el codigo de 6 digitos que muestra la app.</li>
      </ol>
      <Field id="code" label="Codigo de 6 digitos">
        <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="tabular text-center text-xl tracking-widest" />
      </Field>
      {error ? <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={!start || pending} aria-busy={pending}>{pending ? 'Verificando...' : 'Activar'}</Button>
    </form>
  );
}
