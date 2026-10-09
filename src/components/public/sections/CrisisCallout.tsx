import { site } from '@/config/site';

export function CrisisCallout({ className = '' }: { className?: string }) {
  return (
    <aside aria-label="Atención en crisis" className={`rounded-lg border border-accent/50 bg-accent/10 p-5 text-sm ${className}`}>
      <p className="font-medium text-ink">No es un servicio de urgencias</p>
      <p className="mt-1 text-ink-soft">{site.crisis.text}</p>
    </aside>
  );
}
