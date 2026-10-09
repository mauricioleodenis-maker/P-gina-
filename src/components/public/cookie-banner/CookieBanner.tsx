'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const KEY = 'caromafla-cookie-consent-v1';
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30 * 24; // 24 meses (AEPD)
type Choice = 'accepted' | 'rejected';

function read(): Choice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { choice?: Choice; at?: number };
    if (!v.at || Date.now() - v.at > MAX_AGE_MS) return null;
    return v.choice === 'accepted' || v.choice === 'rejected' ? v.choice : null;
  } catch {
    return null;
  }
}

/** Permite reabrir el aviso para cambiar la eleccion (revocacion tan facil como el alta). */
export function openCookieSettings() {
  window.dispatchEvent(new Event('caromafla:cookie-settings'));
}

/**
 * Banner conforme a la guia AEPD 2023: "Aceptar" y "Rechazar" al mismo nivel, sin muro,
 * nada premarcado. APAGADO por defecto: solo se monta con NEXT_PUBLIC_ANALYTICS_ENABLED=true.
 * Sin ese flag no renderiza nada (la web no usa cookies no tecnicas).
 */
export function CookieBanner({ onChange }: { onChange?: (c: Choice) => void }) {
  const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const existing = read();
    if (existing) onChange?.(existing);
    else setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener('caromafla:cookie-settings', reopen);
    return () => window.removeEventListener('caromafla:cookie-settings', reopen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  if (!enabled || !open) return null;

  function choose(choice: Choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() }));
    } catch {
      /* sin almacenamiento: se vuelve a preguntar */
    }
    onChange?.(choice);
    setOpen(false);
  }

  return (
    <section aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border border-sand bg-bg p-5 shadow-lift md:bottom-5">
      <h2 id="cookie-title" className="font-serif text-xl">Medición anónima del sitio</h2>
      <p className="mt-2 text-sm text-ink-soft">
        ¿Nos dejas medir cuántas personas visitan la web para mejorarla? Es opcional y no afecta al uso del sitio. Más información en la{' '}
        <Link href="/cookies" className="underline underline-offset-4">política de cookies</Link>.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => choose('rejected')}>Rechazar</Button>
        <Button variant="secondary" onClick={() => choose('accepted')}>Aceptar</Button>
      </div>
    </section>
  );
}
