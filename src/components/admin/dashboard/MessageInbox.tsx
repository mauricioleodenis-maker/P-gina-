'use client';
import { useTransition } from 'react';
import { Badge, Button, useToast } from '@/components/ui';
import { setMessageHandledAction } from '@/modules/dashboard/actions';
import type { ContactMessageItem } from '@/modules/dashboard/types';
import { formatMadrid } from '@/lib/dates';
import { EmptyState } from './states';

export function MessageInbox({ messages }: { messages: ContactMessageItem[] }) {
  const { toast } = useToast();
  const [pending, start] = useTransition();

  function toggle(m: ContactMessageItem) {
    start(async () => {
      const res = await setMessageHandledAction(m.id, !m.handled);
      toast({ title: res.ok ? (m.handled ? 'Marcado como pendiente' : 'Marcado como gestionado') : res.error, tone: res.ok ? 'ok' : 'danger' });
    });
  }

  if (!messages.length) return <EmptyState title="Sin mensajes">Los mensajes del formulario de contacto apareceran aqui.</EmptyState>;
  return (
    <ul className="grid gap-4">
      {messages.map((m) => (
        <li key={m.id} className="rounded-lg border border-sand bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <strong>{m.name}</strong>
            <Badge tone={m.handled ? 'ok' : 'warn'}>{m.handled ? 'Gestionado' : 'Pendiente'}</Badge>
            <time dateTime={m.createdAt} className="ml-auto text-sm text-ink-soft tabular">{formatMadrid(new Date(m.createdAt))}</time>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            <a className="underline-offset-4 hover:underline" href={`mailto:${m.email}`}>{m.email}</a>
            {m.phone ? <> · <a className="underline-offset-4 hover:underline" href={`tel:${m.phone}`}>{m.phone}</a></> : null}
          </p>
          {/* texto plano: React escapa el contenido; whitespace-pre-wrap conserva saltos */}
          <p className="mt-3 whitespace-pre-wrap break-words">{m.message}</p>
          <div className="mt-3">
            <Button size="sm" variant={m.handled ? 'ghost' : 'secondary'} disabled={pending} onClick={() => toggle(m)}>
              {m.handled ? 'Marcar como pendiente' : 'Marcar como gestionado'}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
