import { Accordion } from '@/components/ui/Accordion';
import { Reveal } from '@/components/motion';
import { faqs } from '@/content/pages/home';

export function FaqSection({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section className="py-20 md:py-28" aria-labelledby="faq-titulo">
      <div className="container-site grid gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          {withHeading ? <h2 id="faq-titulo" className="text-title">Preguntas <span className="accent-italic">frecuentes</span></h2> : null}
        </Reveal>
        <div className="md:col-span-8">
          <Accordion items={faqs} />
        </div>
      </div>
    </section>
  );
}
