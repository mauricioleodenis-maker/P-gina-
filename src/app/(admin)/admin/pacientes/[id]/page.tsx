import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConsentsPanel, DataRequestsPanel, PatientActions, PatientForm, Timeline } from '@/components/admin/patients';
import { Badge, ButtonLink } from '@/components/ui';
import { requireAdmin } from '@/modules/auth/api';
import { getPatient, getTimeline } from '@/modules/patients/api';
import { db } from '@/modules/patients/db';
import { ageOn } from '@/modules/patients/search';
import { MODALITY_LABEL, STATUS_LABEL } from '@/modules/patients/types';
import type { ConsentRow, DataRequestRow } from '@/types/database';

export const metadata: Metadata = { title: 'Ficha de paciente' };
export const dynamic = 'force-dynamic';

export default async function PacientePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const supabase = await db();
  const [timeline, consents, byId, byEmail] = await Promise.all([
    getTimeline(id),
    supabase.from('consents').select('*').eq('patient_id', id).order('given_at', { ascending: false }),
    supabase.from('data_requests').select('*').eq('patient_id', id),
    patient.email ? supabase.from('data_requests').select('*').eq('requester_email', patient.email) : Promise.resolve({ data: [] }),
  ]);
  const requests = [...new Map([...(byId.data ?? []), ...(byEmail.data ?? [])].map((r: DataRequestRow) => [r.id, r])).values()]
    .sort((a, b) => b.received_at.localeCompare(a.received_at));
  const age = ageOn(patient.birth_date);
  const anonymized = !!patient.anonymized_at;

  return (
    <div className="grid gap-10">
      <div className="grid gap-4">
        <Link href="/admin/pacientes" className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:underline">&larr; Pacientes</Link>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl">{patient.full_name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-soft">
              <Badge tone={patient.status === 'active' ? 'ok' : patient.status === 'paused' ? 'warn' : 'neutral'}>{STATUS_LABEL[patient.status]}</Badge>
              <span>{MODALITY_LABEL[patient.modality]}</span>
              {age !== null ? <span>{age} anios</span> : null}
              {age !== null && age < 18 ? <Badge tone="accent">Menor</Badge> : null}
              {patient.restricted ? <Badge tone="warn">Tratamiento limitado</Badge> : null}
              {anonymized ? <Badge>Anonimizado</Badge> : null}
            </p>
          </div>
          <ButtonLink href={`/admin/pacientes/${id}/notas`}>Notas clinicas</ButtonLink>
        </header>
        <PatientActions id={id} fullName={patient.full_name} restricted={patient.restricted} anonymized={anonymized} />
      </div>

      <section aria-labelledby="h-datos" className="grid max-w-3xl gap-4">
        <h2 id="h-datos" className="font-serif text-2xl">Datos</h2>
        <PatientForm patient={patient} />
      </section>

      <section aria-labelledby="h-timeline" className="grid gap-4">
        <h2 id="h-timeline" className="font-serif text-2xl">Historial</h2>
        <Timeline events={timeline} />
      </section>

      <section aria-labelledby="h-consent" className="grid gap-4">
        <h2 id="h-consent" className="font-serif text-2xl">Consentimientos</h2>
        <ConsentsPanel patientId={id} consents={(consents.data ?? []) as ConsentRow[]} />
      </section>

      <section aria-labelledby="h-rights" className="grid gap-4">
        <h2 id="h-rights" className="font-serif text-2xl">Derechos RGPD</h2>
        <DataRequestsPanel patientId={id} requests={requests} />
      </section>
    </div>
  );
}
