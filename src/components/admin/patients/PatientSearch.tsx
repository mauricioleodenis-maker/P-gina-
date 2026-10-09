'use client';
import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui';

/** Busqueda con debounce que actualiza ?q= (el filtrado sin acentos ocurre en servidor). */
export function PatientSearch({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const q = value.trim();
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [value, pathname, router]);

  return (
    <div role="search" className="relative w-full max-w-md">
      <label htmlFor="patient-q" className="sr-only">Buscar paciente</label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
      <Input id="patient-q" type="search" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Buscar por nombre, correo o etiqueta" className="pl-10" autoComplete="off" />
    </div>
  );
}
