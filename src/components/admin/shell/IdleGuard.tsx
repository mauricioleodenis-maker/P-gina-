'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog, DialogContent } from '@/components/ui';
import { signOutAction } from '@/modules/auth/actions';
import { IDLE_TIMEOUT_MS } from '@/modules/auth/types';

const WARN_BEFORE_MS = 2 * 60 * 1000;
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

/** Cierra la sesion tras 30 min sin actividad (aviso 2 min antes). La cookie del middleware es la defensa real. */
export function IdleGuard() {
  const router = useRouter();
  const [warn, setWarn] = useState(false);
  const lastPing = useRef(Date.now());
  const warnRef = useRef(false);
  const last = useRef(Date.now());

  const touch = useCallback(() => {
    if (warnRef.current) return; // con el aviso abierto solo cuenta "Seguir"
    last.current = Date.now();
  }, []);

  const keepAlive = useCallback(() => {
    warnRef.current = false;
    last.current = Date.now();
    setWarn(false);
    lastPing.current = Date.now();
    router.refresh(); // pasa por el middleware y renueva la cookie de inactividad
  }, [router]);

  useEffect(() => {
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      const idle = Date.now() - last.current;
      // Con actividad continua (p. ej. escribiendo) renueva la cookie cada 5 min.
      if (!warnRef.current && idle < 60_000 && Date.now() - lastPing.current > 5 * 60_000) {
        lastPing.current = Date.now();
        router.refresh();
      }
      if (idle >= IDLE_TIMEOUT_MS) void signOutAction('timeout');
      else if (idle >= IDLE_TIMEOUT_MS - WARN_BEFORE_MS && !warnRef.current) {
        warnRef.current = true;
        setWarn(true);
      }
    }, 5000);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [touch, router]);

  return (
    <Dialog open={warn} onOpenChange={(o) => { if (!o) keepAlive(); }}>
      <DialogContent title="Sigues ahi?" description="Por seguridad, cerraremos la sesion en menos de 2 minutos por inactividad.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={keepAlive}>Seguir en la sesion</Button>
          <Button variant="secondary" onClick={() => void signOutAction()}>Cerrar sesion</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
