/** CSP con nonce para /admin y /login (la web publica la cubre P10 con cabeceras estaticas). */
export function buildCsp(nonce: string, opts: { dev?: boolean; supabaseUrl?: string } = {}): string {
  const supa = opts.supabaseUrl ? new URL(opts.supabaseUrl).origin : '';
  const supaWs = supa.replace(/^http/, 'ws');
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", supa, supaWs, 'https://challenges.cloudflare.com'].filter(Boolean),
    'frame-src': ['https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  };
  const body = Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
  return opts.dev ? body : `${body}; upgrade-insecure-requests`;
}

export function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
