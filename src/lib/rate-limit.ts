import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const cache = new Map<string, Ratelimit>();

/** Devuelve true si se permite. Sin Upstash configurado: permite (solo dev). */
export async function rateLimit(
  key: string,
  opts: { limit: number; windowSeconds: number; prefix?: string } = { limit: 5, windowSeconds: 60 },
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return true; // TODO: exigir en produccion
  const id = `${opts.prefix ?? 'rl'}:${opts.limit}:${opts.windowSeconds}`;
  let rl = cache.get(id);
  if (!rl) {
    rl = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(opts.limit, `${opts.windowSeconds} s`),
      prefix: opts.prefix ?? 'rl',
    });
    cache.set(id, rl);
  }
  const { success } = await rl.limit(key);
  return success;
}
