import { headers } from 'next/headers';
import { LoginForm } from './LoginForm';

const NOTICES: Record<string, string> = {
  timeout: 'Tu sesion se cerro por inactividad. Vuelve a entrar.',
  forbidden: 'Esta cuenta no tiene acceso al panel.',
  config: 'El servicio de acceso no esta configurado todavia.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <LoginForm
      next={sp.next}
      notice={sp.error ? NOTICES[sp.error] : undefined}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      nonce={nonce}
    />
  );
}
