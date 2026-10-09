'use client';
import { useActionState } from 'react';
import { Field, Input, Textarea } from '@/components/ui';
import { updateFiscalAction } from '@/modules/settings/actions';
import type { PracticeSettingsRow } from '@/modules/settings/types';
import { FormError, SubmitButton, useSaveFeedback } from './FormParts';

export function FiscalForm({ s }: { s: PracticeSettingsRow }) {
  const [state, action, pending] = useActionState(updateFiscalAction, {});
  useSaveFeedback(state);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="business_name" label="Nombre comercial" error={e.business_name}>
          <Input id="business_name" name="business_name" defaultValue={s.business_name} required />
        </Field>
        <Field id="legal_name" label="Nombre legal / razon social" hint="TODO_REAL: el de la factura" error={e.legal_name}>
          <Input id="legal_name" name="legal_name" defaultValue={s.legal_name ?? ''} />
        </Field>
        <Field id="nif" label="NIF / CIF" hint="TODO_REAL" error={e.nif}>
          <Input id="nif" name="nif" defaultValue={s.nif ?? ''} autoCapitalize="characters" />
        </Field>
        <Field id="college_number" label="N. de colegiada" hint="TODO_REAL" error={e.college_number}>
          <Input id="college_number" name="college_number" defaultValue={s.college_number ?? ''} />
        </Field>
        <Field id="phone" label="Telefono" error={e.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={s.phone ?? ''} />
        </Field>
        <Field id="contact_email" label="Correo de contacto" error={e.contact_email}>
          <Input id="contact_email" name="contact_email" type="email" defaultValue={s.contact_email ?? ''} />
        </Field>
      </div>
      <Field id="address" label="Direccion fiscal y de consulta" hint="TODO_REAL" error={e.address}>
        <Textarea id="address" name="address" rows={2} defaultValue={s.address ?? ''} />
      </Field>
      <fieldset className="grid gap-5 rounded-md border border-sand p-4 sm:grid-cols-2">
        <legend className="px-2 text-sm font-medium">Facturacion</legend>
        <Field id="invoice_series" label="Serie de facturas" hint="Formato F-2026-0001" error={e.invoice_series}>
          <Input id="invoice_series" name="invoice_series" defaultValue={s.invoice_series} maxLength={3} />
        </Field>
        <Field id="default_vat_rate" label="IVA por defecto (%)" hint="0 si hay exencion sanitaria (confirmar con gestor)" error={e.default_vat_rate}>
          <Input id="default_vat_rate" name="default_vat_rate" type="number" step="0.01" min="0" max="21" defaultValue={s.default_vat_rate} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="vat_exemption_text" label="Mencion de exencion de IVA" hint="TODO_REAL: texto legal exacto" error={e.vat_exemption_text}>
            <Textarea id="vat_exemption_text" name="vat_exemption_text" rows={2} defaultValue={s.vat_exemption_text ?? ''} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="invoice_footer" label="Pie de factura" error={e.invoice_footer}>
            <Textarea id="invoice_footer" name="invoice_footer" rows={2} defaultValue={s.invoice_footer ?? ''} />
          </Field>
        </div>
      </fieldset>
      <FormError state={state} />
      <div><SubmitButton pending={pending} /></div>
    </form>
  );
}
