import type { ReactNode } from 'react';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieBanner } from '@/components/public/cookie-banner';
import { BookingCTA, Footer, Header, SkipLink, WhatsAppButton } from '@/components/public/shell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <ToastProvider>
        <SkipLink />
        <Header />
        <main id="contenido" tabIndex={-1} className="outline-none">{children}</main>
        <Footer />
        <BookingCTA />
        <WhatsAppButton />
        <CookieBanner />
      </ToastProvider>
    </MotionProvider>
  );
}
