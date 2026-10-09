'use client';
import { MotionConfig } from 'motion/react';
import Link from 'next/link';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Dialog, DialogContent, ToastProvider, cn } from '@/components/ui';
import { CommandPalette } from './CommandPalette';
import { IdleGuard } from './IdleGuard';
import { NavLinks } from './NavLinks';
import { Topbar } from './Topbar';

const KEY = 'cm_sidebar_collapsed';

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/admin" className="flex min-h-11 items-center px-3 font-serif text-xl text-ink">
      {collapsed ? 'C' : <>Caro<em className="text-primary">mafla</em></>}
    </Link>
  );
}

/** Shell sobrio del panel: sidebar colapsable (escritorio), drawer (movil), topbar y Cmd+K. Sin Lenis. */
export function AdminShell({ name, children }: { name: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === '1');
    } catch {
      /* sin almacenamiento: expandido */
    }
  }, []);

  function toggle() {
    setCollapsed((c) => {
      try { localStorage.setItem(KEY, c ? '0' : '1'); } catch { /* noop */ }
      return !c;
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Saltar al contenido
        </a>
        <div className="min-h-dvh bg-bg text-ink">
          <aside
            aria-label="Navegacion principal"
            className={cn(
              'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sand/70 bg-surface/60 p-3 transition-[width] duration-150 lg:flex',
              collapsed ? 'w-[4.5rem]' : 'w-60',
            )}
          >
            <Brand collapsed={collapsed} />
            <nav className="mt-4 flex-1" aria-label="Secciones">
              <NavLinks collapsed={collapsed} />
            </nav>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={collapsed}
              aria-label={collapsed ? 'Expandir menu' : 'Contraer menu'}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md text-sm text-ink-soft hover:bg-surface"
            >
              {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <><ChevronsLeft className="size-4" aria-hidden />Contraer</>}
            </button>
          </aside>

          <div className={cn('transition-[padding] duration-150', collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-60')}>
            <Topbar name={name} onMenu={() => setDrawer(true)} onSearch={() => setPalette(true)} />
            <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-8">
              {children}
            </main>
          </div>

          <Dialog open={drawer} onOpenChange={setDrawer}>
            <DialogContent title="Menu" side="right">
              <nav aria-label="Secciones (movil)">
                <NavLinks onNavigate={() => setDrawer(false)} />
              </nav>
            </DialogContent>
          </Dialog>
          <CommandPalette open={palette} onOpenChange={setPalette} />
          <IdleGuard />
        </div>
      </ToastProvider>
    </MotionConfig>
  );
}
