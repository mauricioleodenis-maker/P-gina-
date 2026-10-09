import type { Metadata } from 'next';
import { Breathing, DrawLine, Marquee, MagneticButton, Parallax, Reveal, SplitText, TimelineScroll } from '@/components/motion';
import { Accordion, Badge, ButtonLink, Card, CardBody, CardTitle, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { KitInteractive } from './KitInteractive';

// Ruta interna de referencia. Nota: carpetas con "_" son privadas en App Router; este archivo se
// sirve como /_kit solo si Integración la renombra a (public)/kit o la expone (ver handoff P1).
export const metadata: Metadata = { title: 'Kit de diseño', robots: { index: false, follow: false } };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-sand py-12">
    <h2 className="mb-6 text-2xl">{title}</h2>
    {children}
  </section>
);

export default function KitPage() {
  return (
    <div className="container-site py-16">
      <SplitText as="h1" immediate className="text-display" text="Un espacio para respirar con calma" accent={['calma']} />
      <p className="text-lead mt-4 measure">Kit interno de componentes y movimiento. No indexable.</p>
      <Section title="Color">
        <div className="flex flex-wrap gap-3">
          {['bg', 'surface', 'ink', 'ink-soft', 'primary', 'accent', 'sand', 'night'].map((c) => (
            <div key={c} className="w-28"><div className="h-16 rounded-md border border-sand" style={{ background: `var(--color-${c})` }} /><p className="mt-1 text-sm">{c}</p></div>
          ))}
        </div>
      </Section>
      <Section title="Botones y badges">
        <div className="flex flex-wrap items-center gap-3">
          <MagneticButton><ButtonLink href="/reservar" size="lg">Pedir cita</ButtonLink></MagneticButton>
          <ButtonLink href="#" variant="secondary">Secundario</ButtonLink>
          <ButtonLink href="#" variant="ghost">Fantasma</ButtonLink>
          <ButtonLink href="#" variant="accent">Acento</ButtonLink>
          <Badge tone="primary">Presencial</Badge><Badge tone="ok">Confirmada</Badge><Badge tone="warn">Pendiente</Badge><Badge tone="danger">Cancelada</Badge>
        </div>
      </Section>
      <Section title="Formularios, diálogo y aviso"><KitInteractive /></Section>
      <Section title="Tarjeta y tabla">
        <Card className="mb-6 max-w-md"><CardTitle>Primera sesión</CardTitle><CardBody>Una conversación sin prisas para conocernos.</CardBody></Card>
        <Table caption="Tarifas de ejemplo">
          <THead><TR><TH>Servicio</TH><TH>Duración</TH><TH className="text-right">Precio</TH></TR></THead>
          <TBody><TR><TD>Sesión individual</TD><TD>50 min</TD><TD numeric>Consultar</TD></TR></TBody>
        </Table>
      </Section>
      <Section title="Acordeón">
        <Accordion items={[{ id: 'a', title: '¿Cómo es la primera sesión?', content: 'Hablamos con calma de lo que te trae.' }, { id: 'b', title: '¿Y si necesito cancelar?', content: 'Hasta 24 h antes, sin problema.' }]} />
      </Section>
      <Section title="Movimiento">
        <Reveal><p className="text-lead">Este párrafo se revela al entrar.</p></Reveal>
        <DrawLine className="my-6 h-24 w-full max-w-lg text-accent" />
        <Parallax className="my-6 h-32 max-w-md rounded-xl bg-sand" ><div className="p-4">Parallax leve (≤40 px)</div></Parallax>
        <Marquee className="my-6"><span className="font-serif text-3xl">Escucha</span><span className="font-serif text-3xl">Calma</span><span className="font-serif text-3xl">Proceso</span></Marquee>
        <Breathing className="my-10" />
        <TimelineScroll steps={[{ title: 'Escríbeme', body: 'Cuéntame brevemente qué te trae.' }, { title: 'Primera sesión', body: 'Nos conocemos sin compromiso.' }, { title: 'Seguimos a tu ritmo', body: 'Decidimos juntas el camino.' }]} />
      </Section>
    </div>
  );
}
