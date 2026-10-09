import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { site } from '@/config/site';

export const metadata: Metadata = { title: 'Página no encontrada', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="contenido" className="grid min-h-dvh place-items-center px-4 py-20">
      <div className="max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-soft">Error 404</p>
        <h1 className="mt-4 font-serif text-5xl">Esta página no está <span className="accent-italic">aquí</span></h1>
        <p className="mt-5 text-lead">Puede que el enlace haya cambiado. Vuelve al inicio o escríbeme si buscabas algo concreto.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Volver al inicio</ButtonLink>
          <ButtonLink href="/contacto" variant="secondary">Contacto</ButtonLink>
        </div>
        <p className="mt-10 text-sm text-ink-soft">{site.crisis.text}</p>
      </div>
    </main>
  );
}
