'use client';
import { usePathname } from 'next/navigation';
import { CalendarHeart } from 'lucide-react';
import { site } from '@/config/site';
import { ButtonLink } from '@/components/ui/Button';

/** CTA de reserva fija inferior, solo móvil. Oculta en /reservar. */
export function BookingCTA() {
  const pathname = usePathname();
  if (pathname.startsWith(site.bookingHref)) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <ButtonLink href={site.bookingHref} size="lg" className="pointer-events-auto w-full shadow-lift">
        <CalendarHeart className="size-5" aria-hidden /> Pedir primera cita
      </ButtonLink>
    </div>
  );
}
