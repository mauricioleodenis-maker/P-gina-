'use client';
import { useActionState } from 'react';
import { Field, Input } from '@/components/ui';
import { updatePolicyAction } from '@/modules/settings/actions';
import type { PracticeSettingsRow } from '@/modules/settings/types';
import { FormError, SubmitButton, useSaveFeedback } from './FormParts';

export function PolicyForm({ s }: { s: PracticeSettingsRow }) {
  const [state, action, pending] = useActionState(updatePolicyAction, {});
  useSaveFeedback(state);
  const e = state.fieldErrors ?? {};
  const num = (id: keyof PracticeSettingsRow, label: string, hint: string, min: number, max: number) => (
    <Field id={id} label={label} hint={hint} error={e[id]}>
      <Input id={id} name={id} type="number" inputMode="numeric" min={min} max={max} defaultValue={String(s[id])} className="tabular" required />
    </Field>
  );
  return (
    <form action={action} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {num('slot_step_min', 'Paso de la agenda (min)', 'Granularidad de los huecos: 5 a 60', 5, 60)}
        {num('buffer_min', 'Descanso entre sesiones (min)', 'Se reserva tras cada cita', 0, 120)}
        {num('min_notice_hours', 'Antelacion minima (horas)', 'Por defecto 12', 0, 720)}
        {num('max_advance_days', 'Reserva con hasta (dias)', 'Por defecto 60', 1, 365)}
        {num('cancellation_hours', 'Cancelacion gratuita hasta (horas antes)', 'Por defecto 24', 0, 168)}
        {num('recurrence_weeks', 'Semanas de citas recurrentes', 'Se generan por adelantado: 4 a 52', 4, 52)}
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="auto_confirm" defaultChecked={s.auto_confirm} className="size-5 accent-[var(--color-primary)]" />
        <span>Confirmar solicitudes automaticamente <span className="text-sm text-ink-soft">(por defecto: aceptacion manual)</span></span>
      </label>
      <FormError state={state} />
      <div><SubmitButton pending={pending} /></div>
    </form>
  );
}
