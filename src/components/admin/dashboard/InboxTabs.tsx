import Link from 'next/link';
import { cn } from '@/components/ui/cn';

export function InboxTabs({ active, counts }: { active: 'contacto' | 'derechos'; counts: { contacto: number; derechos: number } }) {
  const tabs = [
    { id: 'contacto', label: 'Contacto', n: counts.contacto, href: '/admin/mensajes' },
    { id: 'derechos', label: 'Derechos RGPD', n: counts.derechos, href: '/admin/mensajes?tab=derechos' },
  ] as const;
  return (
    <nav aria-label="Bandejas" className="flex gap-2 border-b border-sand">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? 'page' : undefined}
          className={cn(
            '-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150',
            active === t.id ? 'border-primary text-ink' : 'border-transparent text-ink-soft hover:text-ink',
          )}
        >
          {t.label}
          {t.n > 0 ? <span className="ml-2 rounded-full bg-accent/25 px-2 py-0.5 text-xs tabular">{t.n}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
