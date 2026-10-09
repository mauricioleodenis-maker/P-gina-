import type { Metadata } from 'next';
import { LegalDocument } from '@/components/public/legal';
import { avisoLegal } from '@/content/legal';
import { JsonLd } from '@/components/public/sections';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: avisoLegal.title,
  description: avisoLegal.lead,
  alternates: { canonical: '/aviso-legal' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: avisoLegal.title, url: `${site.url}/aviso-legal` }} />
      <LegalDocument doc={avisoLegal} />
    </>
  );
}
