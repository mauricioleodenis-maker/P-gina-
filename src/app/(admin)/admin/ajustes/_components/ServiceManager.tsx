'use client';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useActionState, useState, useTransition } from 'react';
import { Badge, Button, Dialog, DialogContent, Field, Input, Select, Table, TBody, TD, TH, THead, TR, Textarea, useToast } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { deleteServiceAction, saveServiceAction } from '@/modules/settings/actions';
import { MODALITY_LABEL, type ServiceRow } from '@/modules/settings/types';
import { FormError, SubmitButton } from './FormParts';

function ServiceForm({ service, onDone }: { service: ServiceRow | null; onDone: () => void }) {
  const { toast } = useToast();
  const [modality, setModality] = useState<string>(service?.modality ?? 'in_person');
  const [state, action, pending] = useActionState(async (p: Parameters<typeof saveServiceAction>[0], fd: FormData) => {
    const r = await saveServiceAction(p, fd);
    if (r.ok) {
      toast({ title: 'Servicio guardado', tone: 'ok' });
      onDone();
    }
    return r;
  }, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="id" value={service?.id ?? ''} />
      <input type="hidden" name="modality" value={modality} />
      <Field id="s-name" label="Nombre" error={e.name}><Input id="s-name" name="name" defaultValue={service?.name ?? ''} required /></Field>
      <Field id="s-slug" label="Identificador (URL)" hint="p. ej. terapia-individual" error={e.slug}>
        <Input id="s-slug" name="slug" defaultValue={service?.slug ?? ''} required />
      </Field>
      <Field id="s-desc" label="Descripcion breve" error={e.description}>
        <Textarea id="s-desc" name="description" rows={3} defaultValue={service?.description ?? ''} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="s-dur" label="Duracion (min)" error={e.duration_min}>
          <Input id="s-dur" name="duration_min" type="number" min={10} max={240} defaultValue={service?.duration_min ?? 50} className="tabular" required />
        </Field>
        <Field id="s-price" label="Precio (EUR)" hint="0 se muestra como Consultar" error={e.price_eur}>
          <Input id="s-price" name="price_eur" inputMode="decimal" defaultValue={service ? String(service.price_cents / 100).replace('.', ',') : '0'} className="tabular" required />
        </Field>
        <Field id="s-mod" label="Modalidad">
          <Select id="s-mod" value={modality} onValueChange={setModality} options={Object.entries(MODALITY_LABEL).map(([value, label]) => ({ value, label }))} />
        </Field>
        <Field id="s-ord" label="Orden" error={e.sort_order}>
          <Input id="s-ord" name="sort_order" type="number" min={0} defaultValue={service?.sort_order ?? 0} className="tabular" />
        </Field>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="active" defaultChecked={service?.active ?? true} className="size-5 accent-[var(--color-primary)]" />
        Visible en la web y reservable
      </label>
      <FormError state={state} />
      <div><SubmitButton pending={pending}>Guardar servicio</SubmitButton></div>
    </form>
  );
}

export function ServiceManager({ services }: { services: ServiceRow[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();

  function remove(s: ServiceRow) {
    if (!window.confirm(`Borrar "${s.name}"? Esta accion no se puede deshacer.`)) return;
    start(async () => {
      const r = await deleteServiceAction(s.id);
      toast(r.ok ? { title: 'Servicio borrado', tone: 'ok' } : { title: r.error, tone: 'danger' });
    });
  }

  return (
    <div className="grid gap-4">
      <div><Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" aria-hidden />Nuevo servicio</Button></div>
      {services.length === 0 ? (
        <p className="rounded-md border border-dashed border-sand p-6 text-center text-ink-soft">Aun no hay servicios. Crea el primero (TODO_REAL: servicios y precios reales).</p>
      ) : (
        <Table caption="Servicios y tarifas">
          <THead><TR><TH>Servicio</TH><TH>Duracion</TH><TH>Modalidad</TH><TH className="text-right">Precio</TH><TH>Estado</TH><TH><span className="sr-only">Acciones</span></TH></TR></THead>
          <TBody>
            {services.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.name}</TD>
                <TD className="tabular">{s.duration_min} min</TD>
                <TD>{MODALITY_LABEL[s.modality]}</TD>
                <TD numeric>{s.price_cents === 0 ? 'Consultar' : formatCents(s.price_cents)}</TD>
                <TD>{s.active ? <Badge tone="ok">Activo</Badge> : <Badge>Oculto</Badge>}</TD>
                <TD className="whitespace-nowrap text-right">
                  <button type="button" aria-label={`Editar ${s.name}`} onClick={() => { setEditing(s); setOpen(true); }} className="inline-grid size-11 place-items-center rounded-full hover:bg-bg"><Pencil className="size-4" aria-hidden /></button>
                  <button type="button" aria-label={`Borrar ${s.name}`} onClick={() => remove(s)} className="inline-grid size-11 place-items-center rounded-full text-danger hover:bg-bg"><Trash2 className="size-4" aria-hidden /></button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={editing ? 'Editar servicio' : 'Nuevo servicio'}>
          <ServiceForm key={editing?.id ?? 'new'} service={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
