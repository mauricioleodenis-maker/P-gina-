'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Badge, Button, TBody, TD, TH, THead, TR, Table, useToast } from '@/components/ui';
import { formatMadrid } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { createChargeAction } from '@/modules/billing/actions';
import { centsToPlain } from '@/modules/billing/calc';
import type { PendingCharge } from '@/modules/billing/types';
import { PaymentDialog } from './PaymentDialog';

export function PendingList({ items }: { items: PendingCharge[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, start] = useTransition();

  if (items.length === 0) {
    return <p className="rounded-lg border border-dashed border-sand p-6 text-center text-ink-soft">No hay cobros pendientes. Todo al dia.</p>;
  }
  const total = items.reduce((s, i) => s + i.balanceCents, 0);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-ink-soft">Pendiente total: <strong className="tabular text-ink">{formatCents(total)}</strong></p>
      <Table caption="Cobros pendientes">
        <THead><TR><TH>Paciente</TH><TH>Sesion</TH><TH>Antiguedad</TH><TH className="text-right">Saldo</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead>
        <TBody>
          {items.map((i) => (
            <TR key={i.key}>
              <TD className="font-medium">{i.patientName}</TD>
              <TD>{i.serviceName ?? 'Sesion'}{i.startsAt ? <span className="block text-sm text-ink-soft">{formatMadrid(new Date(i.startsAt), 'dd/MM/yyyy')}</span> : null}</TD>
              <TD><Badge tone={i.ageDays > 30 ? 'danger' : i.ageDays > 7 ? 'warn' : 'neutral'}>{i.ageDays} d</Badge></TD>
              <TD numeric>{formatCents(i.balanceCents)}{i.paidCents > 0 ? <span className="block text-sm text-ink-soft">de {formatCents(i.priceCents)}</span> : null}</TD>
              <TD className="text-right">
                {i.pendingPaymentId ? (
                  <PaymentDialog mode="pending" paymentId={i.pendingPaymentId} balanceEuros={centsToPlain(i.balanceCents)} patientName={i.patientName} trigger={<Button size="sm">Cobrar</Button>} />
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy || !i.appointmentId}
                    onClick={() => start(async () => {
                      const r = await createChargeAction(i.appointmentId!);
                      if (!r.ok) return toast({ title: r.error, tone: 'danger' });
                      toast({ title: 'Cobro pendiente creado', tone: 'ok' });
                      router.refresh();
                    })}
                  >
                    Crear cobro
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
