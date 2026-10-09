import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { fallbackServices, type ServiceItem } from '@/content/services';

/**
 * Servicios activos desde Supabase (lectura anonima permitida por RLS) con respaldo local.
 * Cliente sin cookies para que las paginas sigan siendo estaticas (ISR).
 */
export async function getServices(): Promise<ServiceItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackServices;
  try {
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb
      .from('services')
      .select('slug,name,description,duration_min,price_cents,modality')
      .eq('active', true)
      .order('sort_order');
    if (error || !data?.length) return fallbackServices;
    return data.map((s) => {
      const base = fallbackServices.find((f) => f.slug === s.slug);
      return {
        slug: s.slug,
        name: s.name,
        short: base?.short ?? (s.description ?? '').slice(0, 120),
        description: s.description ?? base?.description ?? '',
        durationMin: s.duration_min,
        priceCents: s.price_cents,
        modality: (s.modality as ServiceItem['modality']) ?? 'both',
        forWhom: base?.forWhom ?? [],
        process: base?.process ?? [],
      };
    });
  } catch {
    return fallbackServices;
  }
}
