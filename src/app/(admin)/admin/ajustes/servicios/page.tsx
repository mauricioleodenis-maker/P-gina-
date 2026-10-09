import type { Metadata } from 'next';
import { listServices } from '@/modules/settings/api';
import { Section } from '../_components/FormParts';
import { ServiceManager } from '../_components/ServiceManager';

export const metadata: Metadata = { title: 'Servicios y tarifas' };

export default async function ServiciosPage() {
  const services = await listServices();
  return (
    <Section title="Servicios y tarifas" hint="Lo activo se muestra en /servicios, /tarifas y en la reserva.">
      <ServiceManager services={services} />
    </Section>
  );
}
