'use client';
import { Check, Mail, Phone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Badge, Button, Card, Dialog, DialogContent, Field, Textarea, useToast } from '@/components/ui';
import { TZ } from '@/lib/dates';
import { acceptRequestAction, rejectRequestAction } from '@/modules/appointments/actions';
import type { RequestView } from '@/modules/appointments/types';

const when = (iso: string) => formatInTimeZone(new Date(iso), TZ, "EEEE d 'de' MMMM, HH:mm", { locale: es });

export function RequestList({ requests }: { requests: RequestView[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string>();
  const [rejecting, setRejecting] = useState<RequestView | null>(null);
  const [reason, setReason] = useState('');

  const accept = (r: RequestView) => {
    setBusy(r.id);
    start(async () => {
      const res = await acceptRequestAction(r.id);
      setBusy(undefined);
      if (!res.ok) return toast({ title: 'No se pudo aceptar', description: res.error, tone: 'danger' });
      toast({ title: 'Solicitud aceptada', description: res.data?.emailSent ? 'Se ha enviado la confirmación con el .ics.' : 'Aviso por email no enviado (revisa la configuración de correo).', tone: 'ok' });
      router.refresh();
    });
  };
  const reject = () => {
    if (!rejecting) return;
    const r = rejecting;
    setBusy(r.id);
    start(async () => {
      const res = await rejectRequestAction(r.id, reason || undefined);
      setBusy(undefined);
      if (!res.ok) return toast({ title: 'No se pudo rechazar', description: res.error, tone: 'danger' });
      setRejecting(null);
      setReason('');
      toast({ title: 'Solicitud rechazada', description: 'El hueco queda libre.', tone: 'ok' });
      router.refresh();
    });
  };

  if (!requests.length) {
    return (
      <Card className="p-10 text-center">
        <p className="font-serif text-xl">Todo al día</p>
        <p className="mt-1 text-ink-soft">No hay solicitudes de cita pendientes. Las nuevas aparecerán aquí.</p>
      </Card>
    );
  }
  return (
    <>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-xl">{r.name}</h3>
                  <Badge tone="warn">Pendiente</Badge>
                  {r.guardianName ? <Badge>Menor · tutor/a {r.guardianName}</Badge> : null}
                </div>
                <p className="capitalize">{when(r.startsAt)} · {r.serviceName} · {r.modality === 'online' ? 'Online' : 'Presencial'}</p>
                <p className="flex flex-wrap gap-x-4 text-sm text-ink-soft">
                  {r.email ? <a className="inline-flex items-center gap-1 underline underline-offset-2" href={`mailto:${r.email}`}><Mail className="size-4" aria-hidden />{r.email}</a> : null}
                  {r.phone ? <a className="inline-flex items-center gap-1 underline underline-offset-2" href={`tel:${r.phone}`}><Phone className="size-4" aria-hidden />{r.phone}</a> : null}
                </p>
                {r.note ? <p className="rounded-md bg-surface px-3 py-2 text-sm">“{r.note}”</p> : null}
                <p className="text-xs text-ink-soft">Recibida el {formatInTimeZone(new Date(r.createdAt), TZ, 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => accept(r)} disabled={pending}><Check className="size-4" aria-hidden />{busy === r.id ? 'Aceptando…' : 'Aceptar'}</Button>
                <Button variant="secondary" onClick={() => setRejecting(r)} disabled={pending}><X className="size-4" aria-hidden />Rechazar</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <Dialog open={rejecting !== null} onOpenChange={(o) => { if (!o) setRejecting(null); }}>
        {rejecting ? (
          <DialogContent title="Rechazar solicitud" description={`${rejecting.name} · ${when(rejecting.startsAt)}`}>
            <div className="space-y-4">
              <Field id="rj-reason" label="Motivo interno (opcional)" hint="No se envía a la persona: recibe un aviso neutro con un enlace para elegir otro día.">
                <Textarea id="rj-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Button variant="danger" onClick={reject} disabled={pending}>Rechazar y liberar hueco</Button>
                <Button variant="secondary" onClick={() => setRejecting(null)}>Volver</Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
