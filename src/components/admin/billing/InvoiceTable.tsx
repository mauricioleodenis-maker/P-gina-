'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Input, TBody, TD, TH, THead, TR, Table, useToast } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { rectifyInvoiceAction, sendInvoiceEmailAction } from '@/modules/billing/actions';
import { INVOICE_STATUS_LABEL, type InvoiceListItem } from '@/modules/billing/types';

function RectifyDialog({ inv }: { inv: InvoiceListItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="secondary">Rectificar</Button></DialogTrigger>
      <DialogContent title={`Rectificar ${inv.number}`} description="Se emite una factura rectificativa (serie R) y la original queda anulada. No se puede deshacer.">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get('reason') ?? '');
            setError('');
            start(async () => {
              const r = await rectifyInvoiceAction({ invoiceId: inv.id, reason });
              if (!r.ok) return setError(r.error);
              toast({ title: `Rectificativa ${r.data?.number ?? ''} emitida`, tone: 'ok' });
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <Field id={`rc-${inv.id}`} label="Motivo"><Input id={`rc-${inv.id}`} name="reason" required minLength={5} maxLength={200} /></Field>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-3">
            <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
            <Button type="submit" variant="danger" disabled={busy}>{busy ? 'Emitiendo...' : 'Emitir rectificativa'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceTable({ items }: { items: InvoiceListItem[] }) {
  const { toast } = useToast();
  const [busy, start] = useTransition();
  if (items.length === 0) return <p className="rounded-lg border border-dashed border-sand p-6 text-center text-ink-soft">Aun no hay facturas emitidas.</p>;
  return (
    <Table caption="Facturas">
      <THead><TR><TH>Numero</TH><TH>Paciente</TH><TH>Fecha</TH><TH>Estado</TH><TH className="text-right">Total</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead>
      <TBody>
        {items.map((i) => (
          <TR key={i.id}>
            <TD className="whitespace-nowrap font-medium">{i.number}{i.rectifiesNumber ? <span className="block text-sm font-normal text-ink-soft">Rectifica {i.rectifiesNumber}</span> : null}</TD>
            <TD>{i.patientName}</TD>
            <TD className="whitespace-nowrap">{i.issuedOn.split('-').reverse().join('/')}</TD>
            <TD><Badge tone={i.status === 'issued' ? 'ok' : i.status === 'void' ? 'danger' : 'neutral'}>{INVOICE_STATUS_LABEL[i.status]}</Badge></TD>
            <TD numeric>{formatCents(i.totalCents)}</TD>
            <TD>
              <div className="flex flex-wrap justify-end gap-2">
                <a href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-full border border-sand px-4 text-sm font-medium hover:bg-surface">PDF</a>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => start(async () => {
                    const r = await sendInvoiceEmailAction(i.id);
                    toast(r.ok ? { title: `Enviada a ${r.data?.to}`, tone: 'ok' } : { title: r.error, tone: 'danger' });
                  })}
                >
                  Enviar
                </Button>
                {i.status === 'issued' && !i.rectifiesId ? <RectifyDialog inv={i} /> : null}
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
