import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/** Cliente de usuario (RLS) con tipado laxo (ver docs/plan/handoffs/P6.md sobre `Database`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseClient = SupabaseClient<any, 'public', any>;
export async function db(): Promise<LooseClient> {
  return (await createClient()) as unknown as LooseClient;
}
