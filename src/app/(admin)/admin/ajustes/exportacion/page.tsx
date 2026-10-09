import type { Metadata } from 'next';
import { Section } from '../_components/FormParts';
import { ExportButton } from '../_components/ExportButton';

export const metadata: Metadata = { title: 'Exportacion' };

export default function ExportacionPage() {
  return (
    <Section
      title="Exportacion de datos"
      hint="Copia en JSON de ajustes, servicios, horario, pacientes, citas, pagos, facturas, consentimientos y solicitudes RGPD. Las notas clinicas no se incluyen: se exportan por paciente desde su ficha. La descarga queda registrada en la auditoria."
    >
      <ExportButton />
    </Section>
  );
}
