import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';
import { site } from '@/config/site';

const font = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Maqueta comun. Sin datos clinicos ni motivo de consulta (PLAN s.7). */
export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#FAF6F0', margin: 0, padding: '24px 0', fontFamily: font, color: '#2B2622' }}>
        <Container style={{ maxWidth: 520, backgroundColor: '#ffffff', borderRadius: 16, padding: '32px 28px' }}>
          <Text style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '0 0 16px' }}>{site.name}</Text>
          {children}
          <Section style={{ borderTop: '1px solid #E3D3BD', marginTop: 24, paddingTop: 16 }}>
            <Text style={{ fontSize: 12, color: '#5E544B', margin: 0 }}>
              Este mensaje no incluye información clínica. Si no has pedido tú esta cita, ignóralo o escríbenos a {site.contact.email}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const p = { fontSize: 16, lineHeight: '24px', margin: '0 0 12px' } as const;
export const btn = {
  display: 'inline-block',
  backgroundColor: '#4D6652',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: 999,
  textDecoration: 'none',
  fontSize: 16,
} as const;
