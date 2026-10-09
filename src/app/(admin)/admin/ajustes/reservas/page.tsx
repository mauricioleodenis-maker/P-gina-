import type { Metadata } from 'next';
import { getPracticeSettings } from '@/modules/settings/api';
import { Section } from '../_components/FormParts';
import { PolicyForm } from '../_components/PolicyForm';

export const metadata: Metadata = { title: 'Politica de reserva' };

export default async function ReservasPage() {
  const s = await getPracticeSettings();
  return (
    <Section title="Politica de reserva" hint="Zona horaria fija: Europe/Madrid.">
      <PolicyForm s={s} />
    </Section>
  );
}
