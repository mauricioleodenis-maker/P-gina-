import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { site } from '@/config/site';
import { CrisisCallout, JsonLd, PageIntro } from '@/components/public/sections';
import { getServices } from '@/components/public/sections/services-data';
import { ServiceHoverList } from '@/components/public/sections/ServiceHoverList';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Primera consulta, terapia individual presencial y online. Conoce cómo trabajo en cada caso.',
  alternates: { canonical: '/servicios' },
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: services.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.name, url: `${site.url}/servicios/${s.slug}` })),
        }}
      />
      <PageIntro eyebrow="Servicios" title="Cómo podemos trabajar" accent={['trabajar']} lead="Cada persona es distinta. Estas son las formas habituales de empezar; si no ves la tuya, escríbeme." />
      <section className="pb-20">
        <div className="container-site">
          <ServiceHoverList services={services} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-center">
            <CrisisCallout />
            <div className="md:text-right"><ButtonLink href={site.bookingHref} size="lg">Pedir cita</ButtonLink></div>
          </div>
        </div>
      </section>
    </>
  );
}
