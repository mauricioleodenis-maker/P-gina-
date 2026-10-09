import Link from 'next/link';
import { Reveal } from '@/components/motion';
import { PageIntro } from '@/components/public/sections';
import { REVIEW_MARK, type LegalDoc } from '@/content/legal';

const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'Europe/Madrid' });

/** Renderiza un texto legal con indice navegable, marca de revision y fecha/version. */
export function LegalDocument({ doc, children }: { doc: LegalDoc; children?: React.ReactNode }) {
  return (
    <>
      <PageIntro eyebrow="Legal" title={doc.title} lead={doc.lead} />
      <section className="pb-20">
        <div className="container-site grid gap-12 md:grid-cols-12">
          <nav aria-label="Índice del documento" className="md:col-span-4 md:sticky md:top-28 md:self-start">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-ink-soft">En este documento</p>
            <ol className="space-y-1 text-sm">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a className="inline-flex min-h-11 items-center underline-offset-4 hover:underline" href={`#${s.id}`}>{s.heading}</a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="md:col-span-8">
            <p role="note" data-review-mark={REVIEW_MARK} className="mb-10 rounded-md border border-warn/50 bg-warn/10 p-4 text-sm text-ink">
              Borrador pendiente de revisión jurídica ({REVIEW_MARK}). Los datos marcados como TODO_REAL los completará la profesional.
            </p>
            <p className="mb-10 text-sm text-ink-soft">
              Versión {doc.version} · Actualizado el <time dateTime={doc.updated}>{fmt.format(new Date(`${doc.updated}T12:00:00Z`))}</time>
            </p>
            <div className="space-y-12">
              {doc.sections.map((s) => (
                <Reveal key={s.id} as="section">
                  <h2 id={s.id} className="scroll-mt-28 font-serif text-3xl">{s.heading}</h2>
                  <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink">
                    {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                    {s.list ? (
                      <ul className="list-disc space-y-2 pl-6 marker:text-accent">
                        {s.list.map((li, i) => <li key={i}>{li}</li>)}
                      </ul>
                    ) : null}
                  </div>
                </Reveal>
              ))}
            </div>
            {children}
            <p className="mt-16 text-sm text-ink-soft">
              Más información: <Link className="underline underline-offset-4" href="/privacidad">Privacidad</Link> ·{' '}
              <Link className="underline underline-offset-4" href="/privacidad/derechos">Ejercer tus derechos</Link> ·{' '}
              <Link className="underline underline-offset-4" href="/cookies">Cookies</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
