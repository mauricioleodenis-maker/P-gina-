'use client';
import { Lock, Unlock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Select, Textarea, useToast } from '@/components/ui';
import { readVersionAction, saveNoteAction, unlockNoteAction, versionsAction } from '@/modules/patients/actions';
import type { NoteVersionMeta } from '@/modules/patients/types';

const IDLE_MS = 5 * 60 * 1000;
const SOAP = 'S (subjetivo):\n\nO (objetivo):\n\nA (analisis):\n\nP (plan):\n';
const TEMPLATES = [{ value: 'free', label: 'Libre' }, { value: 'soap', label: 'SOAP' }];

type Props = {
  patientId: string;
  noteId?: string;
  initialBody?: string;
  initialTemplate?: 'free' | 'soap';
  initialUpdatedAt?: string;
  appointmentId?: string | null;
  disabled?: boolean;
};

/** Editor de nota clinica. Se bloquea a los 5 min sin actividad: borra el texto del DOM/estado. */
export function NoteEditor(p: Props) {
  const { toast } = useToast();
  const [body, setBody] = useState(p.initialBody ?? '');
  const [template, setTemplate] = useState<string>(p.initialTemplate ?? 'free');
  const [noteId, setNoteId] = useState(p.noteId);
  const [updatedAt, setUpdatedAt] = useState(p.initialUpdatedAt);
  const [locked, setLocked] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<NoteVersionMeta[] | null>(null);
  const [preview, setPreview] = useState<{ body: string; savedAt: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  const save = useCallback(async (): Promise<boolean> => {
    if (!bodyRef.current.trim()) { setError('La nota esta vacia.'); return false; }
    setSaving(true);
    setError('');
    const res = await saveNoteAction({
      patientId: p.patientId, noteId, template, body: bodyRef.current,
      appointmentId: p.appointmentId ?? null, expectedUpdatedAt: updatedAt,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error); return false; }
    setNoteId(res.data?.noteId);
    setUpdatedAt(res.data?.updatedAt);
    setDirty(false);
    setVersions(null);
    toast({ title: 'Nota guardada', tone: 'ok' });
    return true;
  }, [p.patientId, p.appointmentId, noteId, template, updatedAt, toast]);

  const lock = useCallback(async () => {
    if (dirty && bodyRef.current.trim()) await save(); // no perder trabajo al bloquear
    setBody('');
    setPreview(null);
    setVersions(null);
    setLocked(true);
  }, [dirty, save]);

  useEffect(() => {
    if (locked || p.disabled) return;
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void lock(), IDLE_MS);
    };
    const evs = ['keydown', 'pointerdown', 'pointermove', 'scroll', 'focusin'] as const;
    evs.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      evs.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [locked, lock, p.disabled]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  async function unlock() {
    if (!noteId) { setLocked(false); return; }
    const res = await unlockNoteAction(p.patientId, noteId);
    if (!res.ok) { setError(res.error); return; }
    setBody(res.data?.body ?? '');
    setUpdatedAt(res.data?.updatedAt);
    setLocked(false);
  }

  async function loadVersions() {
    if (!noteId) return;
    setVersions(await versionsAction(noteId));
  }
  async function openVersion(id: string) {
    if (!noteId) return;
    const res = await readVersionAction(p.patientId, noteId, id);
    if (res.ok && res.data) setPreview(res.data);
  }

  if (locked) {
    return (
      <div role="status" className="grid gap-3 rounded-lg border border-sand bg-surface p-6">
        <p className="flex items-center gap-2 font-medium"><Lock className="size-4" aria-hidden /> Nota bloqueada por inactividad</p>
        <p className="text-ink-soft">El contenido se ha retirado de la pantalla. Al desbloquear se registra una lectura.</p>
        <div><Button onClick={() => void unlock()}><Unlock className="size-4" aria-hidden /> Desbloquear</Button></div>
        {error ? <p role="alert" className="text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <label htmlFor="tpl" className="mb-1.5 block text-sm font-medium">Plantilla</label>
          <Select id="tpl" options={TEMPLATES} value={template} onValueChange={(v) => {
            setTemplate(v);
            if (v === 'soap' && !bodyRef.current.trim()) { setBody(SOAP); setDirty(true); }
          }} disabled={p.disabled} />
        </div>
        <p className="text-sm text-ink-soft">Se bloquea tras 5 min sin actividad.</p>
      </div>
      <div>
        <label htmlFor="note-body" className="mb-1.5 block text-sm font-medium">Nota de sesion</label>
        <Textarea id="note-body" rows={16} value={body} disabled={p.disabled} spellCheck
          onChange={(e) => { setBody(e.target.value); setDirty(true); }} aria-describedby="note-help" />
        <p id="note-help" className="mt-1 text-sm text-ink-soft">Se cifra en el servidor (AES-256-GCM) antes de guardarse.</p>
      </div>
      {error ? <p role="alert" className="text-danger">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} disabled={saving || p.disabled || !dirty}>{saving ? 'Guardando' : 'Guardar nota'}</Button>
        {noteId ? <Button variant="secondary" onClick={() => void loadVersions()}>Ver versiones</Button> : null}
        {dirty ? <span className="text-sm text-warn">Cambios sin guardar</span> : null}
      </div>
      {versions ? (
        <section aria-label="Versiones anteriores" className="rounded-lg border border-sand p-4">
          <h3 className="mb-2 font-medium">Versiones anteriores</h3>
          {versions.length === 0 ? <p className="text-ink-soft">Sin versiones previas.</p> : (
            <ul className="grid gap-1">
              {versions.map((v) => (
                <li key={v.id}><button type="button" className="min-h-11 text-left underline underline-offset-4" onClick={() => void openVersion(v.id)}>
                  {new Date(v.savedAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                </button></li>
              ))}
            </ul>
          )}
          {preview ? (
            <div className="mt-3 rounded-md bg-surface p-3">
              <p className="mb-1 text-sm text-ink-soft">Version del {new Date(preview.savedAt).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
              <pre className="whitespace-pre-wrap font-sans">{preview.body}</pre>
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Cerrar version</Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
