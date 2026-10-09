import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { site } from '@/config/site';
import { fallbackServices, modalityLabel } from '@/content/services';
import { JsonLd, PageIntro, priceLabel } from '@/components/public/sections';
import { getServices } from '@/components/public/sections/services-data';

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return fallbackServices.map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string) {
  return (await getServices()).find((s) => s.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await find((await params).slug);
  if (!s) return {};
  return { title: s.name, description: s.short, alternates: { canonical: `/servicios/${s.slug}` } };
}

export default async function ServicePage({ params }: Props) {
  const s = await find((await params).slug);
  if (!s) notFound();
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Service', name: s.name, description: s.short, provider: { '@type': 'Psychologist', name: site.name, url: site.url }, areaServed: 'ES' },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: site.url },
                { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${site.url}/servicios` },
                { '@type': 'ListItem', position: 3, name: s.name, item: `${site.url}/servicios/${s.slug}` },
              ],
            },
          ],
        }}
      />
      <PageIntro eyebrow="Servicio" title={s.name} lead={s.short} />
      <section className="pb-20">
        <div className="container-site grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="measure text-lg">{s.description}</p>
            {s.forWhom.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-3xl">Puede encajar si</h2>
                <ul className="mt-4 space-y-2 text-ink-soft">
                  {s.forWhom.map((f) => <li key={f} className="border-t border-sand pt-2">{f}</li>)}
                </ul>
              </>
            )}
            {s.process.length > 0 && (
              <>
                <h2 className="mt-12 font-serif text-3xl">Cómo es</h2>
                <ol className="mt-4 list-decimal space-y-2 pl-6 text-ink-soft marker:text-accent-strong">
                  {s.process.map((p) => <li key={p}>{p}</li>)}
                </ol>
              </>
            )}
          </Reveal>
          <Reveal delay={150} as="aside" className="md:col-span-5">
            <div className="rounded-lg bg-surface p-6">
              <dl className="space-y-3">
                <div><dt className="text-sm text-ink-soft">Modalidad</dt><dd>{modalityLabel[s.modality]}</dd></div>
                <div><dt className="text-sm text-ink-soft">Duración</dt><dd>{s.durationMin} minutos</dd></div>
                <div><dt className="text-sm text-ink-soft">Tarifa</dt><dd className="tabular">{priceLabel(s.priceCents)}</dd></div>
              </dl>
              <ButtonLink href={`${site.bookingHref}?servicio=${s.slug}`} className="mt-6 w-full">Reservar este servicio</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
