'use client';
import { useActionState, useRef, useState, useTransition } from 'react';
import { Badge, Button, Field, Input, Select, Table, TBody, TD, TH, THead, TR, useToast } from '@/components/ui';
import { consentUrlAction, uploadConsentAction, withdrawConsentAction } from '@/modules/patients/actions';
import { PURPOSE_LABEL } from '@/modules/patients/types';
import type { FormState } from '@/modules/auth/types';
import type { ConsentRow } from '@/types/database';

const OPTIONS = Object.entries(PURPOSE_LABEL).map(([value, label]) => ({ value, label }));
const fmt = (s: string) => new Date(s).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });

export function ConsentsPanel({ patientId, consents }: { patientId: string; consents: ConsentRow[] }) {
  const { toast } = useToast();
  const [purpose, setPurpose] = useState('informed_consent');
  const [state, action, pending] = useActionState<FormState, FormData>(uploadConsentAction, {});
  const [, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function view(id: string) {
    start(async () => {
      const res = await consentUrlAction(id);
      if (res.ok && res.data) window.open(res.data.url, '_blank', 'noopener,noreferrer'); // caduca en 60 s
      else toast({ title: res.ok ? 'Sin enlace' : res.error, tone: 'danger' });
    });
  }
  function withdraw(id: string) {
    start(async () => {
      const res = await withdrawConsentAction(id, patientId);
      toast({ title: res.ok ? 'Consentimiento retirado' : res.error, tone: res.ok ? 'ok' : 'danger' });
    });
  }

  return (
    <div className="grid gap-6">
      {consents.length === 0 ? <p className="text-ink-soft">Aun no hay consentimientos registrados.</p> : (
        <Table caption="Consentimientos del paciente">
          <THead><TR><TH>Finalidad</TH><TH>Version</TH><TH>Fecha</TH><TH>Estado</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead>
          <TBody>
            {consents.map((c) => (
              <TR key={c.id}>
                <TD>{PURPOSE_LABEL[c.purpose]}</TD>
                <TD>{c.text_version}</TD>
                <TD>{fmt(c.given_at)}</TD>
                <TD>{c.withdrawn_at ? <Badge tone="warn">Retirado</Badge> : <Badge tone="ok">Vigente</Badge>}</TD>
                <TD className="flex flex-wrap gap-1">
                  {c.document_path ? <Button size="sm" variant="secondary" onClick={() => view(c.id)}>Ver PDF</Button> : null}
                  {!c.withdrawn_at ? <Button size="sm" variant="ghost" onClick={() => withdraw(c.id)}>Retirar</Button> : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <form ref={formRef} action={action} className="grid gap-4 rounded-lg border border-sand p-4 sm:grid-cols-2">
        <h3 className="font-medium sm:col-span-2">Registrar consentimiento</h3>
        <input type="hidden" name="patientId" value={patientId} />
        <input type="hidden" name="purpose" value={purpose} />
        <Field id="c-purpose" label="Finalidad"><Select id="c-purpose" options={OPTIONS} value={purpose} onValueChange={setPurpose} /></Field>
        <Field id="c-version" label="Version del texto" hint="Ej. 2026-01"><Input id="c-version" name="textVersion" required /></Field>
        <div className="sm:col-span-2">
          <Field id="c-file" label="PDF firmado (opcional)" hint="Maximo 5 MB. Se guarda en un almacen privado."><Input id="c-file" name="file" type="file" accept="application/pdf" /></Field>
        </div>
        {state.error ? <p role="alert" className="text-danger sm:col-span-2">{state.error}</p> : null}
        {state.ok ? <p role="status" className="text-ok sm:col-span-2">Consentimiento registrado.</p> : null}
        <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{pending ? 'Guardando' : 'Registrar'}</Button></div>
      </form>
    </div>
  );
}
