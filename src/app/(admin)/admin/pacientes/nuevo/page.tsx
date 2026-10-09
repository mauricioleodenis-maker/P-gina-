import type { Metadata } from 'next';
import Link from 'next/link';
import { PatientForm } from '@/components/admin/patients';
import { requireAdmin } from '@/modules/auth/api';

export const metadata: Metadata = { title: 'Nuevo paciente' };

export default async function NuevoPacientePage() {
  await requireAdmin();
  return (
    <div className="grid max-w-3xl gap-6">
      <Link href="/admin/pacientes" className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:underline">&larr; Pacientes</Link>
      <h1 className="font-serif text-3xl">Nuevo paciente</h1>
      <PatientForm />
    </div>
  );
}
