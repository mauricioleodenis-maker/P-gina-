'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input, TBody, TD, TH, THead, TR, Table, useToast } from '@/components/ui';
import { formatMadrid } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { refundPaymentAction } from '@/modules/billing/actions';
import { centsToPlain } from '@/modules/billing/calc';
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, type PaymentListItem } from '@/modules/billing/types';

const tone = { paid: 'ok', pending: 'warn', refunded: 'neutral', failed: 'danger' } as const;

function RefundDialog({ p }: { p: PaymentListItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, start] = useTransition();
  const left = p.amountCents - p.refundedCents;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="secondary">Reembolsar</Button></DialogTrigger>
      <DialogContent title="Reembolsar cobro" description={`${p.patientName}. Maximo reembolsable: ${formatCents(left)}.`}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setError('');
            start(async () => {
              const r = await refundPaymentAction({ paymentId: p.id, amount: String(f.get('amount')), reason: String(f.get('reason') ?? '') });
              if (!r.ok) return setError(r.error);
              toast({ title: 'Reembolso registrado', tone: 'ok' });
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Field id={`rf-a-${p.id}`} label="Importe (EUR)"><Input id={`rf-a-${p.id}`} name="amount" inputMode="decimal" required defaultValue={centsToPlain(left)} className="tabular" /></Field>
          <Field id={`rf-r-${p.id}`} label="Motivo (opcional)"><Input id={`rf-r-${p.id}`} name="reason" maxLength={200} /></Field>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Guardando...' : 'Reembolsar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsTable({ items }: { items: PaymentListItem[] }) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed border-sand p-6 text-center text-ink-soft">Sin cobros en este periodo.</p>;
  return (
    <Table caption="Cobros">
      <THead><TR><TH>Fecha</TH><TH>Paciente</TH><TH>Metodo</TH><TH>Estado</TH><TH className="text-right">Importe</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead>
      <TBody>
        {items.map((p) => (
          <TR key={p.id}>
            <TD className="whitespace-nowrap">{p.paidAt ? formatMadrid(new Date(p.paidAt), 'dd/MM/yyyy') : '-'}</TD>
            <TD>
              <span className="font-medium">{p.patientName}</span>
              <span className="block text-sm text-ink-soft">{p.concept ?? p.serviceName ?? ''}{p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''}</span>
            </TD>
            <TD>{METHOD_LABEL[p.method]}</TD>
            <TD>
              <Badge tone={tone[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
              {p.refundedCents > 0 ? <span className="block text-sm text-ink-soft">Reembolsado {formatCents(p.refundedCents)}</span> : null}
            </TD>
            <TD numeric className={p.status === 'refunded' ? 'text-danger' : ''}>{p.status === 'refunded' ? '-' : ''}{formatCents(p.amountCents)}</TD>
            <TD className="text-right">{p.status === 'paid' && p.refundedCents < p.amountCents ? <RefundDialog p={p} /> : null}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
