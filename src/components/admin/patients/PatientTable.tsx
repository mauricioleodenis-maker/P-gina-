import Link from 'next/link';
import { Badge, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { isMinor } from '@/modules/patients/search';
import { MODALITY_LABEL, STATUS_LABEL, type PatientListItem } from '@/modules/patients/types';

const TONE = { active: 'ok', paused: 'warn', discharged: 'neutral' } as const;

export function PatientTable({ patients }: { patients: PatientListItem[] }) {
  return (
    <Table caption="Pacientes">
      <THead><TR><TH>Nombre</TH><TH>Contacto</TH><TH>Modalidad</TH><TH>Estado</TH></TR></THead>
      <TBody>
        {patients.map((p) => (
          <TR key={p.id}>
            <TD>
              <Link href={`/admin/pacientes/${p.id}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline">{p.full_name}</Link>
              {isMinor(p.birth_date) ? <Badge tone="accent" className="ml-2">Menor</Badge> : null}
              {p.restricted ? <Badge tone="warn" className="ml-2">Limitado</Badge> : null}
            </TD>
            <TD className="text-ink-soft">{p.email ?? p.phone ?? '-'}</TD>
            <TD>{MODALITY_LABEL[p.modality]}</TD>
            <TD><Badge tone={TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge></TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
