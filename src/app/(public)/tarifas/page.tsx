import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui';
import { Accordion } from '@/components/ui/Accordion';
import { site } from '@/config/site';
import { modalityLabel } from '@/content/services';
import { JsonLd, PageIntro, priceLabel } from '@/components/public/sections';
import { getServices } from '@/components/public/sections/services-data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tarifas',
  description: 'Tarifas claras por tipo de sesión, formas de pago y política de cancelación.',
  alternates: { canonical: '/tarifas' },
};

const policy = [
  { id: 'pago', title: 'Formas de pago', content: 'TODO_REAL: efectivo, transferencia, Bizum o tarjeta. Se entrega factura de cada sesión.' },
  { id: 'cancelacion', title: 'Cancelaciones y cambios', content: 'Puedes cancelar o cambiar tu cita con al menos 24 horas de antelación desde el enlace del correo de confirmación. TODO_REAL: condiciones si se avisa más tarde.' },
  { id: 'iva', title: 'Impuestos', content: 'TODO_REAL: indicar si los servicios sanitarios están exentos de IVA o el tipo aplicable.' },
  { id: 'bonos', title: 'Bonos y precios sociales', content: 'TODO_REAL: la profesional indica si ofrece bonos o tarifa reducida.' },
];

export default async function RatesPage() {
  const services = await getServices();
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: services.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'Service', name: s.name, ...(s.priceCents > 0 ? { offers: { '@type': 'Offer', price: (s.priceCents / 100).toFixed(2), priceCurrency: 'EUR' } } : {}) },
          })),
        }}
      />
      <PageIntro eyebrow="Tarifas" title="Precios claros, sin sorpresas" accent={['claros,']} lead="Lo que ves aquí es lo que pagas por sesión. Si el coste es un obstáculo, escríbeme y lo hablamos." />
      <section className="pb-12">
        <div className="container-site">
          <div className="overflow-x-auto rounded-lg border border-sand">
            <table className="w-full min-w-[34rem] text-left">
              <caption className="sr-only">Tarifas por servicio</caption>
              <thead className="bg-surface text-sm text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Servicio</th>
                  <th scope="col" className="px-5 py-3 font-medium">Modalidad</th>
                  <th scope="col" className="px-5 py-3 font-medium">Duración</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {services.map((s) => (
                  <tr key={s.slug}>
                    <th scope="row" className="px-5 py-4 font-serif text-xl font-normal">{s.name}</th>
                    <td className="px-5 py-4 text-ink-soft">{modalityLabel[s.modality]}</td>
                    <td className="tabular px-5 py-4 text-ink-soft">{s.durationMin} min</td>
                    <td className="tabular px-5 py-4 text-right">{priceLabel(s.priceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-10"><ButtonLink href={site.bookingHref} size="lg">Pedir cita</ButtonLink></div>
        </div>
      </section>
      <section className="pb-20">
        <div className="container-site">
          <h2 className="mb-6 font-serif text-3xl">Condiciones</h2>
          <Accordion items={policy} />
        </div>
      </section>
    </>
  );
}
