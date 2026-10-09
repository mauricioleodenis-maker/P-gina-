import { Reveal } from '@/components/motion';
import { homeContent } from '@/content/pages/home';

export function HelpsList() {
  const { helps } = homeContent;
  return (
    <section className="py-20 md:py-28" aria-labelledby="ayuda-titulo">
      <div className="container-site grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <h2 id="ayuda-titulo" className="text-title">{helps.title}</h2>
          <p className="mt-4 text-lead">No hace falta tener un diagnóstico para pedir ayuda. Si algo te pesa, ya es motivo suficiente.</p>
        </Reveal>
        <ul className="md:col-span-7">
          {helps.items.map((it, i) => (
            <Reveal as="li" key={it.title} delay={i * 90} className="border-t border-sand py-7 first:border-t-0 first:pt-0 md:grid md:grid-cols-[3rem_1fr] md:gap-4">
              <span aria-hidden className="tabular font-serif text-xl text-accent-strong">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="font-serif text-2xl">{it.title}</h3>
                <p className="mt-1 text-ink-soft">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
