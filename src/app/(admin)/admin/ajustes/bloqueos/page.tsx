import type { Metadata } from 'next';
import { listAvailabilityExceptions } from '@/modules/settings/api';
import { ExceptionManager } from '../_components/ExceptionManager';
import { Section } from '../_components/FormParts';

export const metadata: Metadata = { title: 'Bloqueos y vacaciones' };

export default async function BloqueosPage() {
  const items = await listAvailabilityExceptions();
  return (
    <Section title="Bloqueos y vacaciones" hint="Dias cerrados o con horario extra. Los bloqueos de una hora concreta se crean desde el calendario.">
      <ExceptionManager items={items} />
    </Section>
  );
}
