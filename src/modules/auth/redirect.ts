/** Solo rutas internas de /admin (evita open redirect). */
export function safeNext(next: string | null | undefined, fallback = '/admin'): string {
  if (!next) return fallback;
  if (!(next === '/admin' || next.startsWith('/admin/') || next.startsWith('/admin?')) || next.startsWith('//') || next.includes('\\') || /[\r\n]/.test(next)) return fallback;
  return next;
}
