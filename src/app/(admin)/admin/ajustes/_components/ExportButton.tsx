'use client';
import { Download } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { exportPracticeDataAction } from '@/modules/settings/actions';

export function ExportButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  function run() {
    setError(undefined);
    start(async () => {
      const r = await exportPracticeDataAction();
      if (!r.ok || !r.data) return setError(r.ok ? 'Error' : r.error);
      const url = URL.createObjectURL(new Blob([r.data.json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = r.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  return (
    <div className="grid gap-3">
      <div><Button onClick={run} disabled={pending} aria-busy={pending}><Download className="size-4" aria-hidden />{pending ? 'Preparando...' : 'Descargar exportacion (JSON)'}</Button></div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
