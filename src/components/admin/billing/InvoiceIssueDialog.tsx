'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input, Select, useToast } from '@/components/ui';
import { formatMadrid } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { issueInvoiceAction } from '@/modules/billing/actions';
import { METHOD_LABEL, type BillablePayment } from '@/modules/billing/types';

type Billable = BillablePayment & { patientId: string; patientName: string };

/** Emite una factura a partir de cobros realizados del mismo paciente. */
export function InvoiceIssueDialog({ billable }: { billable: Billable[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, start] = useTransition();

  const patients = useMemo(() => {
    const m = new Map<string, string>();
    billable.forEach((b) => m.set(b.patientId, b.patientName));
    return [...m].map(([value, label]) => ({ value, label }));
  }, [billable]);
  const options = billable.filter((b) => b.patientId === patientId);
  const total = options.filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.amountCents, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Emitir factura</Button></DialogTrigger>
      <DialogContent title="Emitir factura" description="La factura emitida no se edita: se corrige con una rectificativa.">
        {billable.length === 0 ? (
          <p className="text-ink-soft">No hay cobros realizados pendientes de facturar.</p>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const concept = String(new FormData(e.currentTarget).get('concept') ?? '');
              setError('');
              start(async () => {
                const r = await issueInvoiceAction({ patientId, paymentIds: selected, concept });
                if (!r.ok) return setError(r.error);
                toast({ title: `Factura ${r.data?.number ?? ''} emitida`, tone: 'ok' });
                setOpen(false);
                setSelected([]);
                router.refresh();
              });
            }}
          >
            <Field id="inv-patient" label="Paciente">
              <Select id="inv-patient" options={patients} value={patientId} onValueChange={(v) => { setPatientId(v); setSelected([]); }} placeholder="Elegir paciente" />
            </Field>
            {patientId ? (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-medium">Cobros a incluir</legend>
                {options.map((o) => (
                  <label key={o.id} className="flex min-h-11 items-center gap-3 rounded-md border border-sand px-3">
                    <input
                      type="checkbox"
                      className="size-5 accent-primary"
                      checked={selected.includes(o.id)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id)))}
                    />
                    <span className="flex-1">
                      {o.paidAt ? formatMadrid(new Date(o.paidAt), 'dd/MM/yyyy') : ''} · {METHOD_LABEL[o.method]}
                      {o.concept ? <span className="block text-sm text-ink-soft">{o.concept}</span> : null}
                    </span>
                    <span className="tabular">{formatCents(o.amountCents)}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <Field id="inv-concept" label="Concepto" hint="Ejemplo: Sesiones de psicologia del mes. Sin datos clinicos.">
              <Input id="inv-concept" name="concept" required minLength={3} maxLength={200} defaultValue="Servicios de psicologia" />
            </Field>
            <p className="text-sm text-ink-soft">Total a facturar (IVA segun ajustes fiscales): <strong className="tabular text-ink">{formatCents(total)}</strong></p>
            {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            <div className="flex justify-end gap-3">
              <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={busy || selected.length === 0}>{busy ? 'Emitiendo...' : 'Emitir'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
