import type { Metadata } from 'next';
import { Reveal } from '@/components/motion';
import { PageIntro } from '@/components/public/sections';
import { RightsForm } from '@/components/public/legal';

export const metadata: Metadata = {
  title: 'Ejercer tus derechos',
  description: 'Solicita acceso, rectificación, supresión, oposición, limitación o portabilidad de tus datos.',
  alternates: { canonical: '/privacidad/derechos' },
};

export default function RightsPage() {
  return (
    <>
      <PageIntro eyebrow="Privacidad" title="Ejercer tus derechos" accent={['derechos']} lead="Dime quién eres y qué derecho quieres ejercer. Respondo en un máximo de un mes." />
      <section className="pb-20">
        <div className="container-site max-w-2xl">
          <Reveal><RightsForm /></Reveal>
        </div>
      </section>
    </>
  );
}
