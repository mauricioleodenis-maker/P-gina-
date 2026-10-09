import type { ReactNode } from 'react';
import { Card } from '@/components/ui';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-sand px-4 py-8 text-center">
      <p className="font-medium">{title}</p>
      {children ? <p className="mt-1 text-sm text-ink-soft">{children}</p> : null}
    </div>
  );
}

export function ErrorState({ children = 'No se pudo cargar esta informacion.' }: { children?: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
      {children}
    </p>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-6">
      <span className="sr-only">Cargando el panel...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-sand/30" />
        ))}
      </div>
      <Card className="h-64 animate-pulse bg-sand/30" />
    </div>
  );
}
