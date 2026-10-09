import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/motion';
import { PageIntro } from '@/components/public/sections';
import { site } from '@/config/site';
import { getAllPosts } from '@/content/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos breves sobre bienestar emocional y terapia.',
  alternates: { canonical: '/blog' },
};

const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'Europe/Madrid' });

export default async function BlogIndex() {
  if (!site.blogEnabled) notFound();
  const posts = await getAllPosts();
  return (
    <>
      <PageIntro eyebrow="Blog" title="Ideas para cuidarte" accent={['cuidarte']} lead="Textos breves y sin jerga. No sustituyen a una consulta." />
      <section className="pb-20">
        <ul className="container-site max-w-3xl divide-y divide-sand">
          {posts.map((p) => (
            <Reveal as="li" key={p.slug} className="py-8">
              <time className="text-sm text-ink-soft" dateTime={p.date}>{fmt.format(new Date(`${p.date}T12:00:00Z`))}</time>
              <h2 className="mt-1 font-serif text-3xl">
                <Link className="underline-offset-4 hover:underline" href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="mt-2 text-ink-soft">{p.description}</p>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
