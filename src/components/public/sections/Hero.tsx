import { ButtonLink } from '@/components/ui';
import { DrawLine, MagneticButton, Parallax, Reveal, SplitText, Breathing } from '@/components/motion';
import { site } from '@/config/site';
import { homeContent } from '@/content/pages/home';

export function Hero() {
  const { hero } = homeContent;
  return (
    <section className="relative overflow-hidden pb-16 pt-14 md:pb-28 md:pt-24">
      <div className="container-site grid items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="mb-5 text-sm font-medium uppercase tracking-widest text-ink-soft">Psicología sanitaria</p>
          <SplitText as="h1" text={hero.title} accent={hero.accent} immediate className="text-display" />
          <Reveal immediate delay={350} className="mt-7 max-w-xl">
            <p className="text-lead">{hero.lead}</p>
          </Reveal>
          <Reveal immediate delay={500} className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <ButtonLink href={site.bookingHref} size="lg">Pedir primera cita</ButtonLink>
            </MagneticButton>
            <ButtonLink href="/sobre-mi" variant="ghost" size="lg">Conocer a la psicóloga</ButtonLink>
          </Reveal>
          <DrawLine immediate className="mt-12 h-16 w-full max-w-sm text-accent" />
        </div>
        <div className="relative hidden justify-self-center md:col-span-4 md:block" aria-hidden="true">
          <Parallax distance={32}>
            {/* TODO_REAL: sustituir por retrato real de la consulta/profesional */}
            <div className="relative grid aspect-[4/5] w-72 place-items-center overflow-hidden rounded-t-[10rem] rounded-b-xl bg-surface">
              <Breathing size={200} withControl={false} />
            </div>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
