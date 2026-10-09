'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';

export const settingsSections = [
  { href: '/admin/ajustes/perfil', label: 'Perfil fiscal' },
  { href: '/admin/ajustes/servicios', label: 'Servicios y tarifas' },
  { href: '/admin/ajustes/horario', label: 'Horario' },
  { href: '/admin/ajustes/bloqueos', label: 'Bloqueos y vacaciones' },
  { href: '/admin/ajustes/reservas', label: 'Politica de reserva' },
  { href: '/admin/ajustes/seguridad', label: 'Seguridad' },
  { href: '/admin/ajustes/auditoria', label: 'Auditoria' },
  { href: '/admin/ajustes/exportacion', label: 'Exportacion' },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de ajustes">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
        {settingsSections.map((s) => {
          const active = pathname === s.href;
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm',
                  active ? 'bg-primary/15 font-medium text-primary-strong' : 'text-ink-soft hover:bg-surface hover:text-ink',
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
