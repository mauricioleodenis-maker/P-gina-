import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { ButtonLink, Card } from '@/components/ui';
import { CancelBooking } from '@/components/public/booking';
import { getBookingByToken } from '@/modules/booking/service';
import { modalityText } from '@/modules/booking/service';

// Contiene una cita: nunca indexar ni cachear; sin Referer hacia terceros.
export const metadata: Metadata = {
  title: 'Tu cita',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export const dynamic = 'force-dynamic';

const STATUS: Record<string, string> = {
  requested: 'Solicitud recibida, pendiente de confirmación',
  scheduled: 'Cita confirmada',
  confirmed: 'Cita confirmada',
  completed: 'Cita realizada',
  cancelled: 'Cita cancelada',
  no_show: 'Cita no realizada',
};

export default async function ConfirmationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await getBookingByToken(token);
  if (!b) notFound();
  const when = formatInTimeZone(new Date(b.startsAt), 'Europe/Madrid', "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
  return (
    <section className="py-16 md:py-24">
      <div className="container-site max-w-2xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-ink-soft">Tu cita</p>
        <h1 className="font-serif text-4xl md:text-5xl">{STATUS[b.status] ?? 'Tu cita'}</h1>
        <Card className="mt-8">
          <p className="font-serif text-2xl">{b.serviceName}</p>
          <p className="mt-2 text-lg capitalize">{when}</p>
          <p className="text-ink-soft">Hora de Madrid · {modalityText(b.modality)}</p>
        </Card>
        <div className="mt-8 flex flex-col gap-4">
          {b.status !== 'cancelled' && <ButtonLink href={`/api/booking/ics?token=${token}`} variant="secondary" className="self-start">Añadir al calendario</ButtonLink>}
          {b.cancellable ? (
            <CancelBooking token={token} />
          ) : b.status !== 'cancelled' && b.status !== 'completed' ? (
            <p className="text-ink-soft">Faltan menos de {b.cancellationHours} horas, así que ya no puedes cancelar desde aquí. Escríbeme desde la <a className="underline underline-offset-4" href="/contacto">página de contacto</a>.</p>
          ) : null}
          {b.status === 'cancelled' && <ButtonLink href="/reservar" className="self-start">Elegir otro día</ButtonLink>}
        </div>
      </div>
    </section>
  );
}
