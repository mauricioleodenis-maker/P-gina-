import { SettingsNav } from './_components/SettingsNav';

export default function AjustesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Ajustes</h1>
      <p className="mt-1 text-ink-soft">Datos de la consulta, servicios, horario y seguridad.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[13rem_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
