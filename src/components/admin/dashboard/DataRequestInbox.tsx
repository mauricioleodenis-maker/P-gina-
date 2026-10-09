'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Badge, Button, Textarea, useToast } from '@/components/ui';
import { updateDataRequestStatusAction } from '@/modules/dashboard/actions';
import type { DataRequestItem } from '@/modules/dashboard/types';
import { EmptyState } from './states';

const TYPE: Record<string, string> = {
  access: 'Acceso', rectification: 'Rectificacion', erasure: 'Supresion', objection: 'Oposicion',
  restriction: 'Limitacion', portability: 'Portabilidad', withdrawal: 'Retirada de consentimiento',
};
const STATUS: Record<string, { label: string; tone: 'warn' | 'ok' | 'danger' }> = {
  received: { label: 'Recibida', tone: 'warn' },
  in_progress: { label: 'En curso', tone: 'warn' },
  resolved: { label: 'Resuelta', tone: 'ok' },
  rejected: { label: 'Rechazada', tone: 'danger' },
};
const fmt = (s: string) => new Date(s).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });

function deadline(r: DataRequestItem) {
  if (r.urgency === 'overdue') return <Badge tone="danger">Plazo vencido hace {Math.abs(r.daysLeft ?? 0)} d</Badge>;
  if (r.urgency === 'soon') return <Badge tone="warn">Vence en {r.daysLeft} d</Badge>;
  if (r.urgency === 'ok') return <Badge tone="neutral">{r.daysLeft} d de plazo</Badge>;
  return null;
}

export function DataRequestInbox({ requests }: { requests: DataRequestItem[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [text, setText] = useState<Record<string, string>>({});

  function update(id: string, status: 'in_progress' | 'resolved' | 'rejected') {
    start(async () => {
      const res = await updateDataRequestStatusAction({ id, status, resolution: text[id] });
      toast({ title: res.ok ? 'Solicitud actualizada' : res.error, tone: res.ok ? 'ok' : 'danger' });
    });
  }

  if (!requests.length) return <EmptyState title="Sin solicitudes de derechos">Las solicitudes RGPD recibidas apareceran aqui con su plazo legal de un mes.</EmptyState>;
  return (
    <ul className="grid gap-4">
      {requests.map((r) => {
        const open = r.urgency !== 'closed';
        const s = STATUS[r.status] ?? { label: r.status, tone: 'warn' as const };
        return (
          <li key={r.id} className="rounded-lg border border-sand bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{TYPE[r.type] ?? r.type}</strong>
              <Badge tone={s.tone}>{s.label}</Badge>
              {deadline(r)}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {r.requesterName} · <a className="underline-offset-4 hover:underline" href={`mailto:${r.requesterEmail}`}>{r.requesterEmail}</a>
            </p>
            <p className="text-sm text-ink-soft">Recibida {fmt(r.receivedAt)} · plazo legal {fmt(r.dueAt)}</p>
            {r.patientId ? (
              <p className="mt-1 text-sm"><Link className="text-primary-strong underline-offset-4 hover:underline" href={`/admin/pacientes/${r.patientId}`}>Abrir ficha del paciente</Link></p>
            ) : null}
            {r.resolution ? <p className="mt-2 whitespace-pre-wrap">{r.resolution}</p> : null}
            {open ? (
              <div className="mt-3 grid gap-2">
                <label htmlFor={`res-${r.id}`} className="text-sm font-medium">Resolucion (visible solo en el panel)</label>
                <Textarea id={`res-${r.id}`} rows={2} value={text[r.id] ?? ''} onChange={(e) => setText((t) => ({ ...t, [r.id]: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  {r.status === 'received' ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => update(r.id, 'in_progress')}>En curso</Button> : null}
                  <Button size="sm" disabled={pending} onClick={() => update(r.id, 'resolved')}>Resolver</Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => update(r.id, 'rejected')}>Rechazar</Button>
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
