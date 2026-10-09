import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { buildCsp, makeNonce } from '@/modules/auth/csp';
import { IDLE_COOKIE, IDLE_TIMEOUT_MS } from '@/modules/auth/types';

/**
 * Capas (ADR-0005): sesion -> aal2 -> perfil admin. Solo actua en /admin y /login;
 * la web publica queda estatica (sus cabeceras: vercel.json de P10).
 */
const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/');
const isLoginPath = (p: string) => p === '/login' || p.startsWith('/login/');

function harden(res: NextResponse, csp: string) {
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Cache-Control', 'private, no-store, max-age=0');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isAdminPath(pathname) && !isLoginPath(pathname)) return NextResponse.next();

  const nonce = makeNonce();
  const csp = buildCsp(nonce, { dev: process.env.NODE_ENV !== 'production', supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL });
  request.headers.set('x-nonce', nonce);
  request.headers.set('content-security-policy', csp);

  const { response, user, supabase } = await updateSession(request);

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    Object.entries(params ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return harden(res, csp);
  };

  const secure = process.env.NODE_ENV === 'production';
  const stamp = () =>
    response.cookies.set(IDLE_COOKIE, String(Date.now()), { httpOnly: true, sameSite: 'lax', secure, path: '/' });

  // Sin Supabase configurado (build/dev vacio): el panel no se sirve.
  if (!supabase) return isAdminPath(pathname) ? redirectTo('/login', { error: 'config' }) : harden(response, csp);

  // Caducidad por inactividad (30 min).
  if (user) {
    const last = Number(request.cookies.get(IDLE_COOKIE)?.value ?? 0);
    if (last && Date.now() - last > IDLE_TIMEOUT_MS) {
      await supabase.auth.signOut();
      const res = redirectTo('/login', { error: 'timeout' });
      res.cookies.delete(IDLE_COOKIE);
      return res;
    }
  }

  if (isAdminPath(pathname)) {
    if (!user) return redirectTo('/login', { next: pathname + search });

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== 'aal2') {
      return redirectTo(aal?.nextLevel === 'aal2' ? '/login/mfa' : '/login/mfa/enrol', { next: pathname + search });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || (profile as { role: string }).role !== 'admin') {
      await supabase.auth.signOut();
      return redirectTo('/login', { error: 'forbidden' });
    }
    stamp();
    return harden(response, csp);
  }

  // /login/**
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2' && pathname === '/login') return redirectTo('/admin');
    stamp();
  } else if (pathname !== '/login') {
    return redirectTo('/login');
  }
  return harden(response, csp);
}

export const config = {
  matcher: ['/admin/:path*', '/login/:path*'],
};
