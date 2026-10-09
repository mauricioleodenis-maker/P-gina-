import type { Metadata } from 'next';
import { RequestList } from '@/components/admin/calendar/RequestList';
import { listRequests } from '@/modules/appointments/service';
import { requireAdmin } from '@/modules/auth/api';

export const metadata: Metadata = { title: 'Solicitudes' };
export const dynamic = 'force-dynamic';

export default async function SolicitudesPage() {
  await requireAdmin();
  const requests = await listRequests();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-3xl">Solicitudes de cita</h1>
        <p className="text-ink-soft">
          {requests.length ? `${requests.length} pendiente${requests.length > 1 ? 's' : ''} de respuesta.` : 'Reservas hechas desde la web.'} Al aceptar se crea la ficha del paciente y se envía la confirmación con el .ics.
        </p>
      </header>
      <RequestList requests={requests} />
    </div>
  );
}
