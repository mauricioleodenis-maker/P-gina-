import { Reveal, TimelineScroll } from '@/components/motion';
import { homeContent } from '@/content/pages/home';

export function HowItWorks() {
  return (
    <section className="bg-surface py-20 md:py-28" aria-labelledby="como-titulo">
      <div className="container-site grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <h2 id="como-titulo" className="text-title">Tu primer paso, en <span className="accent-italic">tres</span> pasos</h2>
        </Reveal>
        <div className="md:col-span-8 md:pl-8">
          <TimelineScroll steps={homeContent.steps.map((s) => ({ title: s.title, body: s.body }))} />
        </div>
      </div>
    </section>
  );
}
