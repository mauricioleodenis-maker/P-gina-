import { ButtonLink, Card, CardTitle } from '@/components/ui';

const SHORTCUTS = [
  { href: '/admin/pacientes/nuevo', label: 'Nuevo paciente' },
  { href: '/admin/calendario', label: 'Nueva cita' },
  { href: '/admin/ingresos', label: 'Registrar cobro' },
  { href: '/admin/ingresos/facturas', label: 'Emitir factura' },
];

export function Shortcuts() {
  return (
    <Card>
      <CardTitle className="text-xl">Atajos</CardTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <ButtonLink key={s.href} href={s.href} variant="secondary" size="sm">{s.label}</ButtonLink>
        ))}
      </div>
    </Card>
  );
}
