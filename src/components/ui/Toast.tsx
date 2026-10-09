'use client';
import * as RT from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from './cn';

type ToastItem = { id: number; title: string; description?: string; tone?: 'neutral' | 'ok' | 'danger' };
type Ctx = { toast: (t: Omit<ToastItem, 'id'>) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast requiere <ToastProvider>');
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((t: Omit<ToastItem, 'id'>) => setItems((xs) => [...xs, { ...t, id: Date.now() + Math.random() }]), []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={value}>
      <RT.Provider swipeDirection="right" duration={5000} label="Notificaciones">
        {children}
        {items.map((t) => (
          <RT.Root
            key={t.id}
            onOpenChange={(o) => { if (!o) setItems((xs) => xs.filter((x) => x.id !== t.id)); }}
            className={cn('relative rounded-md border bg-bg p-4 pr-12 shadow-lift [animation:toast-in_240ms_var(--ease-out-soft)]', t.tone === 'ok' ? 'border-ok' : t.tone === 'danger' ? 'border-danger' : 'border-sand')}
          >
            <RT.Title className="font-medium">{t.title}</RT.Title>
            {t.description ? <RT.Description className="text-sm text-ink-soft">{t.description}</RT.Description> : null}
            <RT.Close aria-label="Cerrar aviso" className="absolute right-1 top-1 grid size-11 place-items-center rounded-full hover:bg-surface"><X className="size-4" aria-hidden /></RT.Close>
          </RT.Root>
        ))}
        <RT.Viewport className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2 outline-none" />
      </RT.Provider>
    </ToastCtx.Provider>
  );
}
