import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://caromafla.online'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLINICAL_ENCRYPTION_KEY: z.string().min(1),
  CLINICAL_KEY_VERSION: z.coerce.number().int().positive().default(1),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

/** Variables publicas. Validacion perezosa: no rompe el build en vacio. */
export function publicEnv() {
  return schema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/** Solo servidor. */
export function serverEnv() {
  return serverSchema.parse(process.env);
}

export const flags = {
  blog: process.env.NEXT_PUBLIC_BLOG_ENABLED === 'true',
  analytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
};
