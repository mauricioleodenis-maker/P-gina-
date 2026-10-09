import { ButtonLink } from '@/components/ui';
import { Breathing, MagneticButton, Reveal } from '@/components/motion';
import { site } from '@/config/site';
import { homeContent } from '@/content/pages/home';

export function FinalCta() {
  const { cta } = homeContent;
  return (
    <section className="py-12 md:py-20" aria-labelledby="cta-titulo">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-xl bg-night px-6 py-16 text-[#f3ede2] md:px-16 md:py-24">
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-60" aria-hidden="true">
            <Breathing size={320} withControl={false} />
          </div>
          <Reveal className="relative max-w-2xl">
            <h2 id="cta-titulo" className="text-title">{cta.title}</h2>
            <p className="mt-5 text-lg text-[#d8cfbf]">{cta.body}</p>
            <div className="mt-8">
              <MagneticButton>
                <ButtonLink href={site.bookingHref} variant="accent" size="lg">Pedir cita</ButtonLink>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
