import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Contrato fijo (PLAN s.9). Revalida en servidor con getUser() (nunca getSession), exige
 * perfil admin y sesion MFA aal2. Si falla, redirige a /login (la RLS es la ultima capa).
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') {
    redirect(aal?.nextLevel === 'aal2' ? '/login/mfa' : '/login/mfa/enrol');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') redirect('/login?error=forbidden');

  return { userId: data.user.id };
}

/** Datos minimos del perfil para el shell. */
export async function getCurrentProfile(): Promise<{ userId: string; name: string; email: string }> {
  const { userId } = await requireAdmin();
  const supabase = await createClient();
  const [{ data: profile }, { data: u }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  return { userId, name: profile?.full_name ?? 'Profesional', email: u.user?.email ?? '' };
}
