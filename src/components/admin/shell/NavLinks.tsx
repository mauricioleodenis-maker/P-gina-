'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';
import { navItems } from '../nav-items';
import { navIcons } from './icons';

export function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-1">
      {navItems.map((item) => {
        const Icon = navIcons[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors duration-150',
                active ? 'bg-primary/15 font-medium text-primary-strong' : 'text-ink-soft hover:bg-surface hover:text-ink',
                collapsed && 'justify-center px-0',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
