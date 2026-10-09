'use client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';
import { Dialog, DialogContent, cn } from '@/components/ui';
import { navItems, quickActions } from '../nav-items';

type Entry = { href: string; label: string; hint: string; haystack: string };

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const entries: Entry[] = [
  ...navItems.map((n) => ({ href: n.href, label: n.label, hint: 'Ir a', haystack: fold([n.label, ...(n.keywords ?? [])].join(' ')) })),
  ...quickActions.map((a) => ({ href: a.href, label: a.label, hint: 'Accion', haystack: fold([a.label, ...(a.keywords ?? [])].join(' ')) })),
];

/** Cmd/Ctrl+K. Navegacion y acciones; la busqueda de pacientes llega con P6. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const terms = fold(q).split(/\s+/).filter(Boolean);
    return entries.filter((e) => terms.every((t) => e.haystack.includes(t)));
  }, [q]);

  function go(e: Entry | undefined) {
    if (!e) return;
    onOpenChange(false);
    router.push(e.href);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setQ(''); setActive(0); } }}>
      <DialogContent title="Buscar y navegar" description="Escribe para filtrar. Usa las flechas y Enter." className="top-[20%] -translate-y-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label="Buscar"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
            }}
            placeholder="Pacientes, calendario, ajustes..."
            className="min-h-11 w-full rounded-md border border-sand bg-white pl-10 pr-4 outline-none focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
        <ul id={listId} role="listbox" aria-label="Resultados" className="mt-3 grid max-h-72 gap-1 overflow-auto">
          {results.length === 0 ? <li className="px-3 py-4 text-sm text-ink-soft">Sin resultados.</li> : null}
          {results.map((r, i) => (
            <li
              key={r.href + r.label}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={cn('flex min-h-11 cursor-pointer items-center justify-between rounded-md px-3', i === active && 'bg-surface')}
            >
              <span>{r.label}</span>
              <span className="text-xs text-ink-soft">{r.hint}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
