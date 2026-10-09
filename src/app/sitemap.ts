import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { fallbackServices } from '@/content/services';

/** Solo paginas publicas indexables. Excluye /admin, /login y /reservar/confirmacion. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const paths = [
    '', '/sobre-mi', '/servicios', '/tarifas', '/reservar', '/contacto',
    '/aviso-legal', '/privacidad', '/privacidad/derechos', '/cookies', '/consentimiento-informado',
    ...fallbackServices.map((s) => `/servicios/${s.slug}`),
  ];
  const entries: MetadataRoute.Sitemap = paths.map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : p === '/reservar' ? 0.9 : 0.6,
  }));
  if (site.blogEnabled) {
    const { getAllPosts } = await import('@/content/blog');
    const posts = await getAllPosts();
    entries.push({ url: `${site.url}/blog`, lastModified: now, priority: 0.5 });
    for (const p of posts) entries.push({ url: `${site.url}/blog/${p.slug}`, lastModified: new Date(p.date), priority: 0.5 });
  }
  return entries;
}
