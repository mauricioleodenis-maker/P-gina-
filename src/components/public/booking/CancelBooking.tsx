'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { cancelBookingAction } from '@/app/(public)/reservar/confirmacion/[token]/actions';

export function CancelBooking({ token }: { token: string }) {
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (msg?.ok) return <p role="status" className="text-ok">{msg.text}</p>;
  return (
    <div className="flex flex-col gap-3">
      {!confirm ? (
        <Button variant="secondary" onClick={() => setConfirm(true)}>Cancelar mi cita</Button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span>¿Seguro que quieres cancelarla?</span>
          <Button variant="danger" disabled={pending} onClick={() => start(async () => { const r = await cancelBookingAction(token); setMsg({ ok: r.ok, text: r.message }); })}>
            {pending ? 'Cancelando…' : 'Sí, cancelar'}
          </Button>
          <Button variant="ghost" onClick={() => setConfirm(false)}>No, mantenerla</Button>
        </div>
      )}
      {msg && !msg.ok ? <p role="alert" className="text-danger">{msg.text}</p> : null}
    </div>
  );
}
