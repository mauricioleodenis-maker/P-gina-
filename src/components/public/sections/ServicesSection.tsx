import { ButtonLink } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { getServices } from './services-data';
import { ServiceHoverList } from './ServiceHoverList';

export async function ServicesSection() {
  const services = await getServices();
  return (
    <section className="py-20 md:py-28" aria-labelledby="servicios-titulo">
      <div className="container-site">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 id="servicios-titulo" className="text-title max-w-xl">Formas de <span className="accent-italic">trabajar</span> juntas</h2>
          <ButtonLink href="/servicios" variant="ghost">Ver todos los servicios</ButtonLink>
        </Reveal>
        <ServiceHoverList services={services} />
      </div>
    </section>
  );
}
