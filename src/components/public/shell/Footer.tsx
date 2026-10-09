import Link from 'next/link';
import { site } from '@/config/site';
import { CrisisNotice } from './CrisisNotice';

export function Footer() {
  return (
    <footer className="mt-24 bg-night text-[#e9e2d6]">
      <div className="container-site grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-serif text-4xl">{site.name}<span className="text-accent">.</span></p>
          <p className="mt-3 max-w-sm text-[#cfc6b8]">{site.tagline}.</p>
          <p className="mt-6 text-sm text-[#cfc6b8]">
            {site.professional.name}<br />
            {site.professional.collegiateNumber} · {site.professional.college}
          </p>
        </div>
        <nav aria-label="Pie" className="md:col-span-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-[#cfc6b8] font-sans">Explorar</h2>
          <ul className="mt-4 space-y-1">
            {[...site.nav, { href: site.bookingHref, label: 'Pedir cita' }, ...(site.blogEnabled ? [{ href: '/blog', label: 'Blog' }] : [])].map((n) => (
              <li key={n.href}><Link className="inline-flex min-h-11 items-center hover:text-white hover:underline underline-offset-4" href={n.href}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-[#cfc6b8] font-sans">Contacto</h2>
          <address className="mt-4 space-y-1 not-italic">
            <p><a className="inline-flex min-h-11 items-center hover:underline underline-offset-4" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></p>
            <p>{site.contact.phone}</p>
            <p className="text-[#cfc6b8]">{site.contact.address}</p>
          </address>
        </div>
        <div className="md:col-span-12"><CrisisNotice className="!border-accent/50 !bg-white/5 !text-[#e9e2d6]" /></div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-sm text-[#cfc6b8] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. Todos los derechos reservados.</p>
          <ul className="flex flex-wrap gap-x-2">
            {site.legalNav.map((l) => (
              <li key={l.href}><Link className="inline-flex min-h-11 items-center px-1 hover:text-white hover:underline underline-offset-4" href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
