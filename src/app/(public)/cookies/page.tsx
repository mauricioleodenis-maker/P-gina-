import type { Metadata } from 'next';
import { LegalDocument } from '@/components/public/legal';
import { cookies } from '@/content/legal';
import { JsonLd } from '@/components/public/sections';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: cookies.title,
  description: cookies.lead,
  alternates: { canonical: '/cookies' },
};

export default function Page() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: cookies.title, url: `${site.url}/cookies` }} />
      <LegalDocument doc={cookies} />
    </>
  );
}
