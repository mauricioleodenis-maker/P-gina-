import type { Metadata } from 'next';
import { Reveal } from '@/components/motion';
import { site } from '@/config/site';
import { ContactForm, CrisisCallout, JsonLd, PageIntro } from '@/components/public/sections';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Escríbeme para resolver dudas o pedir información. Respondo en uno o dos días laborables.',
  alternates: { canonical: '/contacto' },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          url: `${site.url}/contacto`,
          mainEntity: { '@type': 'Psychologist', name: site.name, email: site.contact.email, telephone: site.contact.phone },
        }}
      />
      <PageIntro eyebrow="Contacto" title="Escríbeme cuando quieras" accent={['Escríbeme']} lead="Para dudas, información o si prefieres no reservar online. Para pedir cita directamente, usa la reserva." />
      <section className="pb-20">
        <div className="container-site grid gap-14 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <ContactForm />
          </Reveal>
          <Reveal as="aside" delay={150} className="space-y-8 md:col-span-5">
            <address className="space-y-2 not-italic">
              <p><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p>
              <p>{site.contact.phone}</p>
              <p className="text-ink-soft">{site.contact.address}</p>
              {site.contact.mapUrl ? (
                <p><a className="inline-flex min-h-11 items-center underline underline-offset-4" href={site.contact.mapUrl} rel="noopener noreferrer" target="_blank">Ver en el mapa (OpenStreetMap)</a></p>
              ) : null}
            </address>
            <p className="text-ink-soft">Horario de respuesta: TODO_REAL.</p>
            <CrisisCallout />
          </Reveal>
        </div>
      </section>
    </>
  );
}
