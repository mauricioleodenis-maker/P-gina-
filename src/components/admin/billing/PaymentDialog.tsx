'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input, Select, useToast } from '@/components/ui';
import { markPendingPaidAction, recordPaymentAction } from '@/modules/billing/actions';
import { MANUAL_METHODS, METHOD_LABEL } from '@/modules/billing/types';

const methodOptions = MANUAL_METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }));
const today = () => new Date().toISOString().slice(0, 10);

type Common = { trigger: React.ReactNode };
type NewProps = Common & { mode: 'new'; patients: { id: string; name: string }[] };
type PendingProps = Common & { mode: 'pending'; paymentId: string; balanceEuros: string; patientName: string };

/** Registrar cobro nuevo, o cobrar (total o parcial) un pendiente. */
export function PaymentDialog(props: NewProps | PendingProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [method, setMethod] = useState('cash');

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError('');
    start(async () => {
      const base = { amount: String(f.get('amount') ?? ''), method, paidOn: String(f.get('paidOn') ?? '') };
      const r =
        props.mode === 'new'
          ? await recordPaymentAction({ ...base, patientId, concept: String(f.get('concept') ?? '') })
          : await markPendingPaidAction({ ...base, paymentId: props.paymentId });
      if (!r.ok) return setError(r.error);
      toast({ title: 'Cobro registrado', tone: 'ok' });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent
        title={props.mode === 'new' ? 'Registrar cobro' : 'Cobrar'}
        description={props.mode === 'pending' ? `${props.patientName}. Si el importe es menor, el resto queda pendiente.` : undefined}
      >
        <form onSubmit={submit} className="grid gap-4" noValidate>
          {props.mode === 'new' ? (
            <>
              <Field id="pay-patient" label="Paciente">
                <Select id="pay-patient" options={props.patients.map((p) => ({ value: p.id, label: p.name }))} value={patientId} onValueChange={setPatientId} placeholder="Elegir paciente" />
              </Field>
              <Field id="pay-concept" label="Concepto (opcional)"><Input id="pay-concept" name="concept" maxLength={200} /></Field>
            </>
          ) : null}
          <Field id="pay-amount" label="Importe (EUR)">
            <Input id="pay-amount" name="amount" inputMode="decimal" required defaultValue={props.mode === 'pending' ? props.balanceEuros : ''} className="tabular" />
          </Field>
          <Field id="pay-method" label="Metodo"><Select id="pay-method" options={methodOptions} value={method} onValueChange={setMethod} /></Field>
          <Field id="pay-date" label="Fecha de cobro"><Input id="pay-date" name="paidOn" type="date" required defaultValue={today()} /></Field>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={pending || (props.mode === 'new' && !patientId)}>{pending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
