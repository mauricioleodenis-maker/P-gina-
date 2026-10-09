/** Registro de articulos MDX. Para anadir uno: crear el .mdx con `export const meta` y registrarlo aqui. */
export type PostMeta = { title: string; description: string; date: string; tags?: string[] };
export type PostEntry = { slug: string; load: () => Promise<{ default: React.ComponentType; meta: PostMeta }> };

export const posts: PostEntry[] = [
  { slug: 'primeros-pasos', load: () => import('./primeros-pasos.mdx') },
];

export async function getAllPosts() {
  const all = await Promise.all(posts.map(async (p) => ({ slug: p.slug, ...(await p.load()).meta })));
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string) {
  const entry = posts.find((p) => p.slug === slug);
  if (!entry) return null;
  const mod = await entry.load();
  return { slug, meta: mod.meta, Content: mod.default };
}
