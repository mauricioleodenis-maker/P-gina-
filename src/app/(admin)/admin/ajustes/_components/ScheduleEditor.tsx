'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Input, useToast } from '@/components/ui';
import { saveScheduleAction } from '@/modules/settings/actions';
import { MODALITY_LABEL, WEEKDAYS, WEEKDAY_ORDER, type AvailabilityRuleRow } from '@/modules/settings/types';

type Rule = { key: string; weekday: number; start_time: string; end_time: string; modality: AvailabilityRuleRow['modality']; active: boolean };
let n = 0;
const k = () => `r${n++}`;

export function ScheduleEditor({ initial }: { initial: AvailabilityRuleRow[] }) {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>(() =>
    initial.map((r) => ({ key: k(), weekday: r.weekday, start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5), modality: r.modality, active: r.active })),
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  const patch = (key: string, p: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  function save() {
    setError(undefined);
    start(async () => {
      const payload = rules.map(({ key: _k, ...r }) => r);
      const res = await saveScheduleAction(JSON.stringify(payload));
      if (res.ok) toast({ title: 'Horario guardado', tone: 'ok' });
      else setError(res.error);
    });
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-ink-soft">Franjas en las que se puede reservar (hora de Madrid). Los bloqueos puntuales se gestionan en Bloqueos y vacaciones.</p>
      {WEEKDAY_ORDER.map((wd) => {
        const day = rules.filter((r) => r.weekday === wd);
        return (
          <fieldset key={wd} className="rounded-md border border-sand p-4">
            <legend className="px-2 font-medium">{WEEKDAYS[wd]}</legend>
            {day.length === 0 ? <p className="text-sm text-ink-soft">Sin atencion.</p> : null}
            <ul className="grid gap-3">
              {day.map((r) => (
                <li key={r.key} className="flex flex-wrap items-end gap-3">
                  <label className="grid gap-1 text-sm">Desde
                    <Input type="time" value={r.start_time} onChange={(e) => patch(r.key, { start_time: e.target.value })} className="tabular w-32" />
                  </label>
                  <label className="grid gap-1 text-sm">Hasta
                    <Input type="time" value={r.end_time} onChange={(e) => patch(r.key, { end_time: e.target.value })} className="tabular w-32" />
                  </label>
                  <label className="grid gap-1 text-sm">Modalidad
                    <select
                      value={r.modality}
                      onChange={(e) => patch(r.key, { modality: e.target.value as Rule['modality'] })}
                      className="min-h-11 rounded-md border border-sand bg-white px-3"
                    >
                      {Object.entries(MODALITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" checked={r.active} onChange={(e) => patch(r.key, { active: e.target.checked })} className="size-5 accent-[var(--color-primary)]" />Activa
                  </label>
                  <button type="button" aria-label={`Quitar franja del ${WEEKDAYS[wd]}`} onClick={() => setRules((rs) => rs.filter((x) => x.key !== r.key))} className="grid size-11 place-items-center rounded-full text-danger hover:bg-surface">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setRules((rs) => [...rs, { key: k(), weekday: wd, start_time: '10:00', end_time: '14:00', modality: 'both', active: true }])}>
              <Plus className="size-4" aria-hidden />Anadir franja
            </Button>
          </fieldset>
        );
      })}
      {error ? <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      <div><Button onClick={save} disabled={pending} aria-busy={pending}>{pending ? 'Guardando...' : 'Guardar horario'}</Button></div>
    </div>
  );
}
