import type { Metadata } from 'next';
import { LegalDocument } from '@/components/public/legal';
import { consentimientoInformado } from '@/content/legal';
import { JsonLd } from '@/components/public/sections';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: consentimientoInformado.title,
  description: consentimientoInformado.lead,
  alternates: { canonical: '/consentimiento-informado' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: consentimientoInformado.title, url: `${site.url}/consentimiento-informado` }} />
      <LegalDocument doc={consentimientoInformado} />
    </>
  );
}
