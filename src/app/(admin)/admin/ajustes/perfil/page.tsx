import type { Metadata } from 'next';
import { getPracticeSettings } from '@/modules/settings/api';
import { FiscalForm } from '../_components/FiscalForm';
import { Section } from '../_components/FormParts';

export const metadata: Metadata = { title: 'Perfil fiscal' };

export default async function PerfilPage() {
  const s = await getPracticeSettings();
  return (
    <Section title="Perfil fiscal y de la consulta" hint="Aparece en facturas y en la web. Los datos marcados TODO_REAL estan pendientes de la profesional.">
      <FiscalForm s={s} />
    </Section>
  );
}
