'use client';
import { useEffect, useState, useTransition } from 'react';
import { fromZonedTime } from 'date-fns-tz';
import { Button, Dialog, DialogContent, Field, Input, Textarea, cn, fieldClass } from '@/components/ui';
import { TZ } from '@/lib/dates';
import {
  cancelAppointmentAction,
  createAppointmentAction,
  markCompletedAction,
  updateAppointmentAction,
} from '@/modules/appointments/actions';
import type { AppointmentView, Scope } from '@/modules/appointments/types';
import { STATUS_LABEL } from '@/modules/appointments/types';
import { dayOf, timeLabel } from './range';

export type FormOptions = {
  patients: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; durationMin: number; priceCents: number; modality: string }>;
};
export type DialogTarget = { kind: 'create'; day: string; minutes: number } | { kind: 'edit'; appt: AppointmentView } | null;

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const SCOPES: Array<{ id: Scope; label: string }> = [
  { id: 'one', label: 'Solo esta cita' },
  { id: 'following', label: 'Esta y las siguientes' },
  { id: 'all', label: 'Toda la serie (futuras)' },
];

export function AppointmentDialog({ target, options, onClose, onSaved }: {
  target: DialogTarget;
  options: FormOptions;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      {target ? (
        <DialogContent title={target.kind === 'create' ? 'Nueva cita' : 'Cita'} description={target.kind === 'edit' ? `${target.appt.name} · ${STATUS_LABEL[target.appt.status]}` : 'Un hueco solapado con otra cita no se puede guardar.'}>
          <Form key={target.kind === 'edit' ? target.appt.id : `${target.day}-${target.minutes}`} target={target} options={options} onClose={onClose} onSaved={onSaved} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Form({ target, options, onClose, onSaved }: { target: NonNullable<DialogTarget>; options: FormOptions; onClose: () => void; onSaved: (m: string) => void }) {
  const edit = target.kind === 'edit' ? target.appt : null;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [patientId, setPatientId] = useState(edit?.patientId ?? '');
  const [serviceId, setServiceId] = useState(edit?.serviceId ?? options.services[0]?.id ?? '');
  const svc = options.services.find((s) => s.id === serviceId);
  const [date, setDate] = useState(edit ? dayOf(edit.startsAt) : (target as { day: string }).day);
  const [time, setTime] = useState(edit ? timeLabel(edit.startsAt) : hhmm((target as { minutes: number }).minutes));
  const [duration, setDuration] = useState(edit ? Math.round((Date.parse(edit.endsAt) - Date.parse(edit.startsAt)) / 60_000) : (svc?.durationMin ?? 50));
  const [modality, setModality] = useState<'in_person' | 'online'>(edit?.modality ?? 'in_person');
  const [status, setStatus] = useState(edit && ['scheduled', 'confirmed', 'completed', 'no_show'].includes(edit.status) ? edit.status : 'scheduled');
  const [price, setPrice] = useState(edit?.priceCents != null ? (edit.priceCents / 100).toFixed(2) : svc ? (svc.priceCents / 100).toFixed(2) : '');
  const [note, setNote] = useState(edit?.internalNote ?? '');
  const [meeting, setMeeting] = useState(edit?.meetingUrl ?? '');
  const [freq, setFreq] = useState<'' | 'weekly' | 'biweekly' | 'monthly'>('');
  const [count, setCount] = useState('12');
  const [scope, setScope] = useState<Scope>('one');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const inSeries = Boolean(edit?.seriesId);

  useEffect(() => {
    if (!edit && svc) { setDuration(svc.durationMin); setPrice((svc.priceCents / 100).toFixed(2)); }
  }, [serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startsAt = () => fromZonedTime(`${date}T${time}:00`, TZ).toISOString();
  const priceCents = () => (price.trim() === '' ? null : Math.round(Number(price.replace(',', '.')) * 100));
  const finish = (r: { ok: boolean; error?: string; data?: unknown }, msg: string) => {
    if (!r.ok) return setError(r.error);
    const conflicts = (r.data as { conflicts?: string[] } | undefined)?.conflicts;
    onSaved(conflicts?.length ? `${msg} ${conflicts.length} fecha(s) con conflicto no se han tocado.` : msg);
    onClose();
  };

  const save = () => {
    setError(undefined);
    if (!date || !time) return setError('Indica fecha y hora.');
    const price_ = priceCents();
    if (price_ !== null && !Number.isFinite(price_)) return setError('Precio no válido.');
    start(async () => {
      if (!edit) {
        if (!patientId) return setError('Elige un paciente.');
        const n = Number(count);
        finish(
          await createAppointmentAction({
            patientId, serviceId, startsAt: startsAt(), durationMin: duration, modality, status: status === 'confirmed' ? 'confirmed' : 'scheduled',
            priceCents: price_, internalNote: note || null, meetingUrl: modality === 'online' && meeting ? meeting : null,
            recurrence: freq ? { frequency: freq, count: n } : undefined,
          }),
          freq ? 'Serie creada.' : 'Cita creada.',
        );
      } else {
        finish(
          await updateAppointmentAction(edit.id, {
            startsAt: startsAt(), durationMin: duration, modality, status, priceCents: price_, internalNote: note || null,
            meetingUrl: modality === 'online' && meeting ? meeting : null, serviceId,
          }, scope),
          'Cita actualizada.',
        );
      }
    });
  };

  const cancel = () => start(async () => finish(await cancelAppointmentAction(edit!.id, scope), 'Cita cancelada.'));
  const complete = () => start(async () => finish(await markCompletedAction(edit!.id), 'Marcada como realizada.'));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
      {error ? <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      {!edit ? (
        <Field id="ap-patient" label="Paciente">
          <select id="ap-patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)} className={fieldClass}>
            <option value="">Elegir paciente</option>
            {options.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      ) : null}
      <Field id="ap-service" label="Servicio">
        <select id="ap-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={fieldClass}>
          {options.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.durationMin} min</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="ap-date" label="Fecha"><Input id="ap-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} disabled={inSeries && scope !== 'one'} /></Field>
        <Field id="ap-time" label="Hora (Madrid)"><Input id="ap-time" type="time" step={900} required value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <Field id="ap-dur" label="Duración (min)"><Input id="ap-dur" type="number" min={15} max={240} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></Field>
        <Field id="ap-price" label="Precio (€)"><Input id="ap-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="tabular-nums" /></Field>
        <Field id="ap-mod" label="Modalidad">
          <select id="ap-mod" value={modality} onChange={(e) => setModality(e.target.value as 'in_person' | 'online')} className={fieldClass}>
            <option value="in_person">Presencial</option><option value="online">Online</option>
          </select>
        </Field>
        <Field id="ap-status" label="Estado">
          <select id="ap-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={fieldClass}>
            <option value="scheduled">Programada</option><option value="confirmed">Confirmada</option>
            {edit ? <><option value="completed">Realizada</option><option value="no_show">No asistió</option></> : null}
          </select>
        </Field>
      </div>
      {modality === 'online' ? <Field id="ap-url" label="Enlace de videollamada" hint="Opcional."><Input id="ap-url" type="url" value={meeting} onChange={(e) => setMeeting(e.target.value)} placeholder="https://" /></Field> : null}
      <Field id="ap-note" label="Nota interna" hint="Administrativa. No escribas datos clínicos aquí; van en las notas de sesión cifradas."><Textarea id="ap-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></Field>

      {!edit ? (
        <fieldset className="space-y-3 rounded-md border border-sand p-3">
          <legend className="px-1 text-sm font-medium">Repetición</legend>
          <select aria-label="Frecuencia" value={freq} onChange={(e) => setFreq(e.target.value as typeof freq)} className={fieldClass}>
            <option value="">No se repite</option><option value="weekly">Cada semana</option><option value="biweekly">Cada 2 semanas</option><option value="monthly">Cada mes</option>
          </select>
          {freq ? <Field id="ap-count" label="Número de sesiones" hint="Se crean las próximas semanas; el resto se añade solo cada día."><Input id="ap-count" type="number" min={2} max={104} value={count} onChange={(e) => setCount(e.target.value)} /></Field> : null}
        </fieldset>
      ) : null}

      {inSeries ? (
        <fieldset className="rounded-md border border-sand p-3">
          <legend className="px-1 text-sm font-medium">Esta cita es parte de una serie. Aplicar a</legend>
          {SCOPES.map((s) => (
            <label key={s.id} className="flex min-h-11 items-center gap-2">
              <input type="radio" name="scope" checked={scope === s.id} onChange={() => setScope(s.id)} className="size-4 accent-primary" /> {s.label}
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className={cn('flex flex-wrap items-center gap-2 pt-2', edit && 'justify-between')}>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : edit ? 'Guardar' : 'Crear cita'}</Button>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
        {edit && edit.status !== 'cancelled' ? (
          <div className="flex flex-wrap gap-2">
            {edit.status === 'scheduled' || edit.status === 'confirmed' ? <Button variant="secondary" onClick={complete} disabled={pending}>Marcar realizada</Button> : null}
            {confirmCancel ? (
              <Button variant="danger" onClick={cancel} disabled={pending}>Confirmar cancelación</Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmCancel(true)} className="text-danger">Cancelar cita</Button>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
