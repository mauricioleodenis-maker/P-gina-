import { Reveal } from '@/components/motion';
import { homeContent } from '@/content/pages/home';

export function Modalities() {
  return (
    <section className="bg-surface py-20 md:py-24" aria-labelledby="modalidades-titulo">
      <div className="container-site">
        <Reveal><h2 id="modalidades-titulo" className="text-title">Presencial u online</h2></Reveal>
        <div className="mt-10 grid gap-x-16 gap-y-8 md:grid-cols-2">
          {homeContent.modalities.map((m, i) => (
            <Reveal key={m.title} delay={i * 120} className="border-t border-ink/20 pt-5">
              <h3 className="font-serif text-2xl">{m.title}</h3>
              <p className="mt-2 text-ink-soft">{m.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
