import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageIntro, JsonLd } from '@/components/public/sections';
import { CrisisCallout } from '@/components/public/sections';
import { site } from '@/config/site';
import { getPost, posts } from '@/content/blog';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return site.blogEnabled ? posts.map((p) => ({ slug: p.slug })) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = site.blogEnabled ? await getPost(slug) : null;
  if (!post) return { title: 'Artículo no encontrado', robots: { index: false } };
  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: 'article', title: post.meta.title, description: post.meta.description, publishedTime: post.meta.date },
  };
}

export default async function PostPage({ params }: Props) {
  if (!site.blogEnabled) notFound();
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { Content, meta } = post;
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: meta.title,
          description: meta.description,
          datePublished: meta.date,
          mainEntityOfPage: `${site.url}/blog/${slug}`,
          author: { '@type': 'Person', name: site.professional.name },
        }}
      />
      <PageIntro eyebrow="Blog" title={meta.title} lead={meta.description} />
      <article className="container-site max-w-3xl space-y-5 pb-12 text-lg leading-relaxed [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-3xl [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        <Content />
      </article>
      <div className="container-site max-w-3xl pb-20"><CrisisCallout /></div>
    </>
  );
}
