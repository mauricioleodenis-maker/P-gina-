import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso profesional',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <main id="main" className="mx-auto grid min-h-dvh w-full max-w-md content-center gap-8 px-4 py-12">
        <div className="text-center">
          <p className="font-serif text-3xl text-ink">
            Caro<em className="text-primary">mafla</em>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Acceso privado de la profesional</p>
        </div>
        <div className="rounded-lg border border-sand/70 bg-surface p-6 shadow-soft sm:p-8">{children}</div>
        <p className="text-center text-xs text-ink-soft">
          Zona restringida. El acceso queda registrado. Si no eres la profesional, cierra esta pagina.
        </p>
      </main>
    </div>
  );
}
