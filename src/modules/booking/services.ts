import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { fallbackServices } from '@/content/services';
import type { BookableService } from './types';

/** Servicios activos (lectura anonima permitida por RLS). Sin Supabase: respaldo sin `id` => reserva no disponible. */
export async function getBookableServices(): Promise<{ services: BookableService[]; fromFallback: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await sb
        .from('services')
        .select('id,slug,name,description,duration_min,price_cents,modality')
        .eq('active', true)
        .order('sort_order');
      if (!error && data?.length) {
        return {
          fromFallback: false,
          services: data.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            description: s.description ?? fallbackServices.find((f) => f.slug === s.slug)?.short ?? '',
            durationMin: s.duration_min,
            priceCents: s.price_cents,
            modality: s.modality as BookableService['modality'],
          })),
        };
      }
    } catch {
      /* usa respaldo */
    }
  }
  return {
    fromFallback: true,
    services: fallbackServices.map((s) => ({
      id: '',
      slug: s.slug,
      name: s.name,
      description: s.short,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      modality: s.modality,
    })),
  };
}
