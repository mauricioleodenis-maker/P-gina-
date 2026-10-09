'use client';
import { Download } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, buttonVariants, cn, Dialog, DialogClose, DialogContent, DialogTrigger, Input, useToast } from '@/components/ui';
import { anonymizePatientAction, setRestrictedAction } from '@/modules/patients/actions';

export function PatientActions({ id, fullName, restricted, anonymized }: { id: string; fullName: string; restricted: boolean; anonymized: boolean }) {
  const { toast } = useToast();
  const [confirm, setConfirm] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function toggleRestricted() {
    start(async () => {
      const res = await setRestrictedAction(id, !restricted);
      toast({ title: res.ok ? (restricted ? 'Limitacion retirada' : 'Tratamiento limitado') : res.error, tone: res.ok ? 'ok' : 'danger' });
    });
  }
  function anonymize() {
    start(async () => {
      const res = await anonymizePatientAction(id, confirm);
      if (res.ok) { setOpen(false); toast({ title: 'Paciente anonimizado', tone: 'ok' }); }
      else toast({ title: res.error, tone: 'danger' });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`/admin/pacientes/${id}/export?format=json`} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}><Download className="size-4" aria-hidden /> JSON</a>
      <a href={`/admin/pacientes/${id}/export?format=pdf`} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}><Download className="size-4" aria-hidden /> PDF</a>
      {!anonymized ? (
        <>
          <Button variant="ghost" size="sm" onClick={toggleRestricted} disabled={pending} aria-pressed={restricted}>
            {restricted ? 'Quitar limitacion' : 'Limitar tratamiento'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="danger" size="sm">Anonimizar</Button></DialogTrigger>
            <DialogContent title="Anonimizar paciente" description="Se borran los datos identificativos. Las notas cifradas se conservan sin identidad por la obligacion legal de custodia de la historia clinica. No se puede deshacer.">
              <label htmlFor="anon-confirm" className="mb-1.5 block text-sm font-medium">Escribe &laquo;{fullName}&raquo; para confirmar</label>
              <Input id="anon-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
              <div className="mt-4 flex gap-2">
                <Button variant="danger" onClick={anonymize} disabled={pending || confirm.trim() !== fullName}>Anonimizar definitivamente</Button>
                <DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
