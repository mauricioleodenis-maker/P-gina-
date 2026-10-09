'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { site } from '@/config/site';
import { ButtonLink } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/Dialog';
import { cn } from '@/components/ui/cn';

export function Header() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setScrolled(y > 8);
        if (Math.abs(y - last) > 8) {
          setHidden(y > last && y > 120);
          last = y;
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[transform,background-color,box-shadow] duration-300 ease-[var(--ease-calm)]',
        scrolled ? 'bg-bg/95 shadow-[0_1px_0_var(--color-sand)] backdrop-blur-[2px]' : 'bg-transparent',
        hidden && !open ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <div className="container-site flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" className="font-serif text-2xl tracking-tight" aria-label={`${site.name}, inicio`}>
          {site.name}<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {site.nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
              className={cn('min-h-11 content-center rounded-full px-4 transition-colors hover:bg-surface', isActive(n.href) && 'text-primary-strong underline decoration-accent decoration-2 underline-offset-8')}>
              {n.label}
            </Link>
          ))}
          <ButtonLink href={site.bookingHref} size="sm" className="ml-3">Pedir cita</ButtonLink>
        </nav>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button type="button" aria-label="Abrir menú" className="grid size-11 place-items-center rounded-full hover:bg-surface md:hidden">
              <Menu className="size-6" aria-hidden />
            </button>
          </DialogTrigger>
          <DialogContent title="Menú" side="right">
            <nav aria-label="Móvil" className="flex flex-col gap-1">
              {site.nav.map((n) => (
                <DialogClose asChild key={n.href}>
                  <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined} className="min-h-12 content-center rounded-md px-3 font-serif text-2xl hover:bg-surface">{n.label}</Link>
                </DialogClose>
              ))}
              <DialogClose asChild>
                <ButtonLink href={site.bookingHref} className="mt-4" size="lg">Pedir cita</ButtonLink>
              </DialogClose>
            </nav>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
