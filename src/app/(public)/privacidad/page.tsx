import type { Metadata } from 'next';
import { LegalDocument } from '@/components/public/legal';
import { privacidad } from '@/content/legal';
import { JsonLd } from '@/components/public/sections';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: privacidad.title,
  description: privacidad.lead,
  alternates: { canonical: '/privacidad' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: privacidad.title, url: `${site.url}/privacidad` }} />
      <LegalDocument doc={privacidad} />
    </>
  );
}
