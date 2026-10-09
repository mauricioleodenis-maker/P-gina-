import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { site } from '@/config/site';
import { aboutContent } from '@/content/pages/about';
import { CrisisCallout, FinalCta, JsonLd, PageIntro } from '@/components/public/sections';
import { ScrubTextClient } from './ScrubTextClient';

export const metadata: Metadata = {
  title: 'Sobre mí',
  description: 'Quién soy, cómo trabajo y qué puedes esperar de la terapia: respeto, confidencialidad y honestidad.',
  alternates: { canonical: '/sobre-mi' },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Sobre mí', url: `${site.url}/sobre-mi` }} />
      <PageIntro eyebrow="Sobre mí" title="Una persona detrás de la consulta" accent={['persona']} lead={aboutContent.lead} />
      <section className="py-12 md:py-20">
        <div className="container-site grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4" aria-hidden="true">
            {/* TODO_REAL: retrato */}
            <div className="aspect-[3/4] w-full max-w-xs rounded-t-[8rem] rounded-b-xl bg-sand/60" />
          </div>
          <div className="md:col-span-8">
            <ScrubTextClient text={aboutContent.statement} />
            <dl className="mt-12 grid gap-6 sm:grid-cols-2">
              {aboutContent.facts.map((f, i) => (
                <Reveal key={f.label} delay={i * 80} className="border-t border-sand pt-4">
                  <dt className="text-sm uppercase tracking-widest text-ink-soft">{f.label}</dt>
                  <dd className="mt-1">{f.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section className="bg-surface py-16 md:py-24" aria-labelledby="valores">
        <div className="container-site">
          <h2 id="valores" className="text-title">Cómo entiendo mi trabajo</h2>
          <div className="mt-10 grid gap-x-16 gap-y-8 md:grid-cols-3">
            {aboutContent.values.map((v, i) => (
              <Reveal key={v.title} delay={i * 100} className="border-t border-ink/20 pt-5">
                <h3 className="font-serif text-2xl">{v.title}</h3>
                <p className="mt-2 text-ink-soft">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <div className="container-site mt-16 grid gap-6 md:grid-cols-2 md:items-center">
        <CrisisCallout />
        <div className="md:text-right"><ButtonLink href={site.bookingHref} size="lg">Pedir primera cita</ButtonLink></div>
      </div>
      <FinalCta />
    </>
  );
}
