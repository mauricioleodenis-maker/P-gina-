import { ButtonLink } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { site } from '@/config/site';
import { homeContent } from '@/content/pages/home';
import { ScrubText } from './ScrubText';

export function AboutPreview() {
  const { about } = homeContent;
  return (
    <section className="py-20 md:py-32" aria-labelledby="sobre-titulo">
      <div className="container-site grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4" aria-hidden="true">
          {/* TODO_REAL: retrato de la profesional */}
          <div className="aspect-[3/4] w-full max-w-xs rounded-t-[8rem] rounded-b-xl bg-sand/60" />
        </div>
        <div className="md:col-span-8">
          <Reveal>
            <h2 id="sobre-titulo" className="text-title">{about.title.replace('{{nombre}}', site.professional.name)}</h2>
          </Reveal>
          <ScrubText text={about.text} className="mt-6 max-w-2xl font-serif text-2xl leading-snug md:text-3xl" />
          <Reveal className="mt-8">
            <ButtonLink href="/sobre-mi" variant="secondary">Leer más sobre mí</ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
