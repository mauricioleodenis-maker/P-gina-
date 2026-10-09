import { site } from '@/config/site';

/** Aviso de crisis (112 / 024). Presente en el pie de todas las páginas públicas. */
export function CrisisNotice({ className = '' }: { className?: string }) {
  return (
    <aside aria-label="Ayuda en crisis" className={`rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-ink ${className}`}>
      <strong className="font-medium">¿Necesitas ayuda ahora?</strong>{' '}
      {site.crisis.text}{' '}
      <a className="font-medium underline underline-offset-4" href={`tel:${site.crisis.emergency}`}>Llamar al 112</a>
      {' · '}
      <a className="font-medium underline underline-offset-4" href={`tel:${site.crisis.suicidePrevention}`}>Llamar al 024</a>
    </aside>
  );
}
