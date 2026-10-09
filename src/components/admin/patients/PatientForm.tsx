'use client';
import { useActionState, useState } from 'react';
import { Button, Field, Input, Textarea, Select } from '@/components/ui';
import { createPatientAction, updatePatientAction } from '@/modules/patients/actions';
import { isMinor } from '@/modules/patients/search';
import type { PatientDetail } from '@/modules/patients/types';
import type { FormState } from '@/modules/auth/types';

const MODALITIES = [{ value: 'in_person', label: 'Presencial' }, { value: 'online', label: 'Online' }];
const STATUSES = [{ value: 'active', label: 'Activo' }, { value: 'paused', label: 'En pausa' }, { value: 'discharged', label: 'Alta' }];

export function PatientForm({ patient }: { patient?: PatientDetail }) {
  const action = patient ? updatePatientAction.bind(null, patient.id) : createPatientAction;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [birth, setBirth] = useState(patient?.birth_date ?? '');
  const [hasGuardian, setHasGuardian] = useState(!!patient?.guardian);
  const [modality, setModality] = useState<string>(patient?.modality ?? 'in_person');
  const [status, setStatus] = useState<string>(patient?.status ?? 'active');
  const e = state.fieldErrors ?? {};
  const minor = isMinor(birth || null);
  const g = patient?.guardian;
  const readOnly = !!patient?.anonymized_at;

  return (
    <form action={formAction} className="grid gap-6" noValidate aria-describedby={state.error ? 'pf-error' : undefined}>
      <fieldset disabled={readOnly || pending} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Datos del paciente</legend>
        <Field id="full_name" label="Nombre completo" error={e.full_name}>
          <Input id="full_name" name="full_name" defaultValue={patient?.full_name} required autoComplete="off" aria-invalid={!!e.full_name} />
        </Field>
        <Field id="email" label="Correo" error={e.email}>
          <Input id="email" name="email" type="email" defaultValue={patient?.email ?? ''} autoComplete="off" aria-invalid={!!e.email} />
        </Field>
        <Field id="phone" label="Telefono" error={e.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={patient?.phone ?? ''} autoComplete="off" />
        </Field>
        <Field id="birth_date" label="Fecha de nacimiento" error={e.birth_date}>
          <Input id="birth_date" name="birth_date" type="date" value={birth} onChange={(ev) => setBirth(ev.target.value)} aria-invalid={!!e.birth_date} />
        </Field>
        <Field id="national_id" label="DNI/NIE" hint="Solo para facturar.">
          <Input id="national_id" name="national_id" defaultValue={patient?.national_id ?? ''} autoComplete="off" />
        </Field>
        <Field id="default_price_euros" label="Tarifa por defecto (EUR)" error={e.default_price_euros}>
          <Input id="default_price_euros" name="default_price_euros" inputMode="decimal" defaultValue={patient?.default_price_cents != null ? String(patient.default_price_cents / 100) : ''} className="tabular" />
        </Field>
        <div className="sm:col-span-2">
          <Field id="address" label="Direccion">
            <Input id="address" name="address" defaultValue={patient?.address ?? ''} autoComplete="off" />
          </Field>
        </div>
        <Field id="emergency_contact" label="Contacto de emergencia">
          <Input id="emergency_contact" name="emergency_contact" defaultValue={patient?.emergency_contact ?? ''} autoComplete="off" />
        </Field>
        <Field id="tags" label="Etiquetas" hint="Separadas por comas.">
          <Input id="tags" name="tags" defaultValue={patient?.tags?.join(', ') ?? ''} />
        </Field>
        <Field id="modality" label="Modalidad">
          <Select id="modality" name="modality" options={MODALITIES} value={modality} onValueChange={setModality} />
        </Field>
        <Field id="status" label="Estado">
          <Select id="status" name="status" options={STATUSES} value={status} onValueChange={setStatus} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="internal_notes" label="Notas administrativas" hint="No clinicas: nada de datos de salud aqui.">
            <Textarea id="internal_notes" name="internal_notes" rows={3} defaultValue={patient?.internal_notes ?? ''} maxLength={1000} />
          </Field>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-sand p-4 sm:col-span-2">
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="has_guardian" checked={hasGuardian} onChange={(ev) => setHasGuardian(ev.target.checked)} className="size-5 accent-primary" />
            <span>Menor de edad o con representante legal (tutor/a)</span>
          </label>
          {minor && !hasGuardian ? (
            <p role="status" className="text-sm text-warn">Fecha de nacimiento de menor de 18: registra al tutor/a y su consentimiento.</p>
          ) : null}
          {hasGuardian ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="g_name" label="Nombre del tutor/a" error={e.g_name}><Input id="g_name" name="g_name" defaultValue={g?.name ?? ''} /></Field>
              <Field id="g_relationship" label="Relacion"><Input id="g_relationship" name="g_relationship" defaultValue={g?.relationship ?? ''} /></Field>
              <Field id="g_email" label="Correo del tutor/a" error={e.g_email}><Input id="g_email" name="g_email" type="email" defaultValue={g?.email ?? ''} /></Field>
              <Field id="g_phone" label="Telefono del tutor/a"><Input id="g_phone" name="g_phone" type="tel" defaultValue={g?.phone ?? ''} /></Field>
              <Field id="g_national_id" label="DNI/NIE del tutor/a"><Input id="g_national_id" name="g_national_id" defaultValue={g?.national_id ?? ''} /></Field>
            </div>
          ) : null}
        </div>

        <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
          <input type="checkbox" name="consent_data" defaultChecked={patient?.consent_data ?? false} className="size-5 accent-primary" />
          <span>Consentimiento explicito para tratar datos de salud recogido</span>
        </label>
      </fieldset>

      {state.error ? <p id="pf-error" role="alert" className="text-danger">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-ok">Cambios guardados.</p> : null}
      {readOnly ? <p className="text-ink-soft">Ficha anonimizada: solo lectura.</p> : (
        <div><Button type="submit" disabled={pending}>{pending ? 'Guardando' : patient ? 'Guardar cambios' : 'Crear paciente'}</Button></div>
      )}
    </form>
  );
}
