'use client';
import { LogOut, Menu, Search } from 'lucide-react';
import { signOutAction } from '@/modules/auth/actions';

export function Topbar({ name, onMenu, onSearch }: { name: string; onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-sand/70 bg-bg/95 px-3 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menu"
        className="grid size-11 place-items-center rounded-full hover:bg-surface lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="flex min-h-11 flex-1 items-center gap-2 rounded-full border border-sand bg-white px-4 text-left text-sm text-ink-soft hover:border-ink-soft/50 sm:max-w-sm"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1">Buscar...</span>
        <kbd className="hidden rounded border border-sand px-1.5 text-xs sm:inline">Ctrl K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
        <form action={signOutAction.bind(null, undefined)}>
          <button type="submit" className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-surface">
            <LogOut className="size-4" aria-hidden />
            <span>Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
