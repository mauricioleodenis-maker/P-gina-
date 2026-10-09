import type { Metadata } from 'next';
import { listAvailabilityRules } from '@/modules/settings/api';
import { Section } from '../_components/FormParts';
import { ScheduleEditor } from '../_components/ScheduleEditor';

export const metadata: Metadata = { title: 'Horario' };

export default async function HorarioPage() {
  const rules = await listAvailabilityRules();
  return (
    <Section title="Horario semanal de atencion">
      <ScheduleEditor initial={rules} />
    </Section>
  );
}
