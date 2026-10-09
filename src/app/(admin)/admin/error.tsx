'use client';
import { Button } from '@/components/ui';

export default function AdminHomeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="grid gap-3 rounded-lg border border-danger/30 bg-danger/10 p-6">
      <p className="font-medium text-danger">No se pudo cargar el panel.</p>
      <p className="text-sm text-ink-soft">Puede ser un fallo temporal. Prueba de nuevo.</p>
      <div><Button onClick={reset} variant="secondary" size="sm">Reintentar</Button></div>
    </div>
  );
}
