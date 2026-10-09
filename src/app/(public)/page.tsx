import type { Metadata } from 'next';
import { site } from '@/config/site';
import { AboutPreview, FaqSection, FinalCta, HelpsList, Hero, HowItWorks, JsonLd, Modalities, ServicesSection } from '@/components/public/sections';
import { faqs } from '@/content/pages/home';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: `${site.name} · Psicología sanitaria, presencial y online` },
  description: 'Consulta de psicología en un espacio tranquilo y sin prisas. Terapia individual presencial y online. Pide tu primera cita.',
  alternates: { canonical: '/' },
  openGraph: { title: site.name, description: site.tagline, url: site.url, type: 'website', locale: 'es_ES' },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Psychologist', 'MedicalBusiness'],
        name: site.name,
        url: site.url,
        description: site.description,
        email: site.contact.email,
        telephone: site.contact.phone,
        address: { '@type': 'PostalAddress', streetAddress: site.contact.address, addressCountry: 'ES' }, // TODO_REAL
        medicalSpecialty: 'Psychiatric',
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.title, acceptedAnswer: { '@type': 'Answer', text: f.content } })),
      },
    ],
  };
  return (
    <>
      <JsonLd data={jsonLd} />
      <Hero />
      <HelpsList />
      <HowItWorks />
      <AboutPreview />
      <ServicesSection />
      <Modalities />
      <FaqSection />
      <FinalCta />
    </>
  );
}
