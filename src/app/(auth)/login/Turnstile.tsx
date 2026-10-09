'use client';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

/** Widget de Cloudflare Turnstile. Inyecta el campo `cf-turnstile-response` en el formulario. */
export function Turnstile({ siteKey, nonce }: { siteKey: string; nonce?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let widget: string | undefined;
    const mount = () => {
      if (ref.current && window.turnstile && !widget) {
        widget = window.turnstile.render(ref.current, { sitekey: siteKey, language: 'es', theme: 'light' });
      }
    };
    if (window.turnstile) mount();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      if (nonce) s.nonce = nonce;
      s.onload = mount;
      document.head.appendChild(s);
    }
    return () => {
      if (widget && window.turnstile) window.turnstile.remove(widget);
    };
  }, [siteKey, nonce]);
  return <div ref={ref} className="min-h-[65px]" />;
}
