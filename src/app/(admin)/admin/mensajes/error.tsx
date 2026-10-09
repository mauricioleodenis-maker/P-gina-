'use client';
import { Button } from '@/components/ui';

export default function MensajesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="grid gap-3 rounded-lg border border-danger/30 bg-danger/10 p-6">
      <p className="font-medium text-danger">No se pudieron cargar los mensajes.</p>
      <div><Button onClick={reset} variant="secondary" size="sm">Reintentar</Button></div>
    </div>
  );
}
