import { MessageCircle } from 'lucide-react';
import { site } from '@/config/site';

/** Botón de WhatsApp: solo se muestra si hay número real (TODO_REAL en site.ts). */
export function WhatsAppButton() {
  const n = site.contact.whatsapp;
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}`}
      rel="noopener noreferrer"
      target="_blank"
      aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
      className="fixed bottom-24 right-4 z-30 grid size-12 place-items-center rounded-full bg-primary text-primary-ink shadow-lift transition-colors hover:bg-primary-strong md:bottom-6"
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
