import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { PatientSearch, PatientTable } from '@/components/admin/patients';
import { ButtonLink } from '@/components/ui';
import { requireAdmin } from '@/modules/auth/api';
import { listPatients } from '@/modules/patients/api';

export const metadata: Metadata = { title: 'Pacientes' };
export const dynamic = 'force-dynamic';

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q = '' } = await searchParams;
  const patients = await listPatients(q.slice(0, 80));
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Pacientes</h1>
        <ButtonLink href="/admin/pacientes/nuevo"><Plus className="size-4" aria-hidden /> Nuevo paciente</ButtonLink>
      </header>
      <PatientSearch initial={q} />
      <p className="text-sm text-ink-soft" role="status" aria-live="polite">
        {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}{q ? ` para "${q}"` : ''}
      </p>
      {patients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sand p-8 text-center">
          <p className="font-medium">{q ? 'Sin resultados' : 'Aun no hay pacientes'}</p>
          <p className="mt-1 text-ink-soft">{q ? 'Prueba con otro nombre o correo.' : 'Las fichas se crean al aceptar una solicitud o con "Nuevo paciente".'}</p>
        </div>
      ) : (
        <PatientTable patients={patients} />
      )}
    </div>
  );
}
