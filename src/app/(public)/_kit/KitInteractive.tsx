'use client';
import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTrigger, Field, Input, Select, Textarea, useToast } from '@/components/ui';

export function KitInteractive() {
  const [v, setV] = useState('');
  const { toast } = useToast();
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <Field id="k-name" label="Nombre" hint="Como prefieras que te llame."><Input id="k-name" placeholder="Tu nombre" /></Field>
        <Field id="k-mod" label="Modalidad">
          <Select id="k-mod" value={v} onValueChange={setV} placeholder="Elige una modalidad" options={[{ value: 'p', label: 'Presencial' }, { value: 'o', label: 'Online' }]} />
        </Field>
        <Field id="k-msg" label="Mensaje" error="Ejemplo de error accesible"><Textarea id="k-msg" aria-invalid="true" aria-describedby="k-msg-error" /></Field>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <Dialog>
          <DialogTrigger asChild><Button variant="secondary">Abrir diálogo</Button></DialogTrigger>
          <DialogContent title="Un diálogo tranquilo" description="Se cierra con Esc y devuelve el foco."><p>Contenido de ejemplo.</p></DialogContent>
        </Dialog>
        <Button onClick={() => toast({ title: 'Guardado', description: 'Tus cambios están a salvo.', tone: 'ok' })}>Mostrar aviso</Button>
      </div>
    </div>
  );
}
