'use client';
import { useState, useTransition } from 'react';
import { Badge, Button, Textarea, useToast } from '@/components/ui';
import { updateDataRequestAction } from '@/modules/patients/actions';
import { REQUEST_TYPE_LABEL } from '@/modules/patients/types';
import type { DataRequestRow } from '@/types/database';

const STATUS: Record<string, { label: string; tone: 'neutral' | 'warn' | 'ok' | 'danger' }> = {
  received: { label: 'Recibida', tone: 'warn' },
  in_progress: { label: 'En curso', tone: 'warn' },
  resolved: { label: 'Resuelta', tone: 'ok' },
  rejected: { label: 'Rechazada', tone: 'danger' },
};
const fmt = (s: string) => new Date(s).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' });

export function DataRequestsPanel({ patientId, requests }: { patientId: string; requests: DataRequestRow[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [text, setText] = useState<Record<string, string>>({});
  if (!requests.length) return <p className="text-ink-soft">Sin solicitudes de derechos asociadas a este paciente.</p>;

  function update(id: string, status: 'in_progress' | 'resolved' | 'rejected') {
    start(async () => {
      const res = await updateDataRequestAction(patientId, { id, status, resolution: text[id] });
      toast({ title: res.ok ? 'Solicitud actualizada' : res.error, tone: res.ok ? 'ok' : 'danger' });
    });
  }

  return (
    <ul className="grid gap-4">
      {requests.map((r) => {
        const open = r.status === 'received' || r.status === 'in_progress';
        const overdue = open && new Date(r.due_at) < new Date();
        const s = STATUS[r.status] ?? { label: r.status, tone: 'neutral' as const };
        return (
          <li key={r.id} className="rounded-lg border border-sand p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{REQUEST_TYPE_LABEL[r.type]}</strong>
              <Badge tone={s.tone}>{s.label}</Badge>
              {overdue ? <Badge tone="danger">Plazo vencido</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-ink-soft">Recibida {fmt(r.received_at)} - plazo legal {fmt(r.due_at)}</p>
            {r.resolution ? <p className="mt-2">{r.resolution}</p> : null}
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
