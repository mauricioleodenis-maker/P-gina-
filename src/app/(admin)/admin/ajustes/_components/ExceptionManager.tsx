'use client';
import { Trash2 } from 'lucide-react';
import { useActionState, useRef, useState, useTransition } from 'react';
import { Badge, Button, Field, Input, useToast } from '@/components/ui';
import { addExceptionAction, deleteExceptionAction } from '@/modules/settings/actions';
import type { AvailabilityExceptionRow } from '@/modules/settings/types';
import { FormError, SubmitButton, useSaveFeedback } from './FormParts';

const fmt = (d: string) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));

export function ExceptionManager({ items }: { items: AvailabilityExceptionRow[] }) {
  const { toast } = useToast();
  const [closed, setClosed] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (p: Parameters<typeof addExceptionAction>[0], fd: FormData) => {
    const r = await addExceptionAction(p, fd);
    if (r.ok) formRef.current?.reset();
    return r;
  }, {});
  useSaveFeedback(state, 'Bloqueo anadido');
  const [, start] = useTransition();
  const e = state.fieldErrors ?? {};

  return (
    <div className="grid gap-6">
      <form ref={formRef} action={action} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="x-from" label="Desde (dia)" error={e.starts_on}><Input id="x-from" name="starts_on" type="date" required /></Field>
          <Field id="x-to" label="Hasta (dia, incluido)" error={e.ends_on}><Input id="x-to" name="ends_on" type="date" required /></Field>
        </div>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="is_closed" checked={closed} onChange={(ev) => setClosed(ev.target.checked)} className="size-5 accent-[var(--color-primary)]" />
          Cerrado todo el dia (vacaciones, festivo)
        </label>
        {!closed ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="x-st" label="Horario extra desde" error={e.start_time}><Input id="x-st" name="start_time" type="time" /></Field>
            <Field id="x-et" label="hasta" error={e.end_time}><Input id="x-et" name="end_time" type="time" /></Field>
          </div>
        ) : null}
        <Field id="x-reason" label="Motivo (interno, no se publica)" error={e.reason}><Input id="x-reason" name="reason" /></Field>
        <FormError state={state} />
        <div><SubmitButton pending={pending}>Anadir</SubmitButton></div>
      </form>
      <ul className="grid gap-2" aria-label="Bloqueos programados">
        {items.length === 0 ? <li className="text-ink-soft">No hay bloqueos programados.</li> : null}
        {items.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sand bg-bg px-4 py-2">
            <span>
              <span className="tabular">{fmt(x.starts_on)}{x.ends_on !== x.starts_on ? ` - ${fmt(x.ends_on)}` : ''}</span>{' '}
              {x.is_closed ? <Badge tone="warn">Cerrado</Badge> : <Badge tone="primary">Extra {x.start_time?.slice(0, 5)}-{x.end_time?.slice(0, 5)}</Badge>}
              {x.reason ? <span className="ml-2 text-sm text-ink-soft">{x.reason}</span> : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Quitar bloqueo del ${fmt(x.starts_on)}`}
              onClick={() => start(async () => {
                const r = await deleteExceptionAction(x.id);
                toast(r.ok ? { title: 'Bloqueo eliminado', tone: 'ok' } : { title: r.error, tone: 'danger' });
              })}
            ><Trash2 className="size-4" aria-hidden /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
