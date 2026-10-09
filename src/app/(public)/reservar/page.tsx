import type { Metadata } from 'next';
import { site } from '@/config/site';
import { BookingWizard } from '@/components/public/booking';
import { CrisisCallout, PageIntro } from '@/components/public/sections';
import { getBookableServices } from '@/modules/booking/services';

export const metadata: Metadata = {
  title: 'Reservar cita',
  description: 'Elige servicio, día y hora en cuatro pasos. Sin cuenta y sin datos clínicos.',
  alternates: { canonical: '/reservar' },
};

// La disponibilidad se pide en el cliente; la pagina puede ser estatica (ISR).
export const revalidate = 300;

export default async function ReservarPage({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const [{ servicio }, { services, fromFallback }] = await Promise.all([searchParams, getBookableServices()]);
  return (
    <>
      <PageIntro eyebrow="Reservar" title="Pide tu cita" accent={['cita']} lead="Cuatro pasos, unos tres minutos. Revisaré tu solicitud y te confirmaré por correo." />
      <section className="pb-24">
        <div className="container-site">
          <noscript>
            <p className="mb-6 rounded-lg bg-surface p-4">Para reservar necesitas activar JavaScript. Si no puedes, escríbeme desde la <a className="underline" href="/contacto">página de contacto</a>.</p>
          </noscript>
          <BookingWizard services={services} initialSlug={servicio} unavailable={fromFallback} />
          <div className="mx-auto mt-16 max-w-3xl">
            <CrisisCallout />
            <p className="mt-6 text-sm text-ink-soft">
              No escribas datos de salud en este formulario. {site.name} cumple el RGPD: puedes ver cómo se tratan tus datos en la <a className="underline underline-offset-4" href="/privacidad">política de privacidad</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
