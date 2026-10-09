'use client';
import { Button } from '@/components/ui';

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/40 p-8 text-center">
      <p className="font-medium">No se pudieron cargar los ingresos.</p>
      <p className="mt-1 text-ink-soft">Reintenta en unos segundos.</p>
      <Button className="mt-4" onClick={reset}>Reintentar</Button>
    </div>
  );
}
