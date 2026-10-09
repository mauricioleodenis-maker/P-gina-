import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NoteEditor } from '@/components/admin/patients';
import { Badge, ButtonLink } from '@/components/ui';
import { requireAdmin } from '@/modules/auth/api';
import { getPatient } from '@/modules/patients/api';
import { listNotes, readNote } from '@/modules/patients/notes';
import { TEMPLATE_LABEL } from '@/modules/patients/types';

export const metadata: Metadata = { title: 'Notas clinicas' };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;

export default async function NotasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ n?: string; nueva?: string; cita?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { n, nueva, cita } = await searchParams;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const notes = await listNotes(id);
  const selected = n && UUID.test(n) ? await readNote(id, n) : null; // descifra y audita
  const creating = nueva !== undefined;
  const blocked = patient.restricted || !!patient.anonymized_at;

  return (
    <div className="grid gap-6">
      <Link href={`/admin/pacientes/${id}`} className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:underline">&larr; {patient.full_name}</Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl">Notas clinicas</h1>
        {!blocked ? <ButtonLink href="?nueva">Nueva nota</ButtonLink> : null}
      </header>
      <p className="text-sm text-ink-soft">Contenido cifrado. Cada lectura queda registrada en la auditoria.</p>
      {patient.restricted ? <p role="status" className="text-warn">Tratamiento limitado: no se pueden crear ni editar notas.</p> : null}

      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <nav aria-label="Notas del paciente">
          {notes.length === 0 ? <p className="text-ink-soft">Sin notas todavia.</p> : (
            <ul className="grid gap-1">
              {notes.map((x) => (
                <li key={x.id}>
                  <Link href={`?n=${x.id}`} aria-current={selected?.id === x.id ? 'page' : undefined}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-md px-3 hover:bg-surface aria-[current=page]:bg-surface">
                    <time dateTime={x.createdAt}>{new Date(x.createdAt).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'medium' })}</time>
                    <Badge>{TEMPLATE_LABEL[x.template]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <section aria-label="Editor">
          {selected ? (
            <NoteEditor key={selected.id} patientId={id} noteId={selected.id} initialBody={selected.body}
              initialTemplate={selected.template} initialUpdatedAt={selected.updatedAt} appointmentId={selected.appointmentId} disabled={blocked} />
          ) : creating && !blocked ? (
            <NoteEditor key="new" patientId={id} appointmentId={cita && UUID.test(cita) ? cita : null} />
          ) : (
            <p className="text-ink-soft">Elige una nota o crea una nueva.</p>
          )}
        </section>
      </div>
    </div>
  );
}
