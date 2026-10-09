import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/api';
import { remainingRecoveryCodes } from '@/modules/auth/recovery';
import { Section } from '../_components/FormParts';
import { PasswordForm, RecoveryCodesPanel, SessionsPanel } from '../_components/SecurityPanel';

export const metadata: Metadata = { title: 'Seguridad' };

export default async function SeguridadPage() {
  const { userId } = await requireAdmin();
  const remaining = await remainingRecoveryCodes(userId);
  return (
    <div className="grid gap-6">
      <Section title="Contrasena"><PasswordForm /></Section>
      <Section title="Verificacion en dos pasos" hint="Activa y obligatoria. Si cambias de movil, usa un codigo de recuperacion al entrar para configurarlo de nuevo.">
        <RecoveryCodesPanel remaining={remaining} />
      </Section>
      <Section title="Sesiones"><SessionsPanel /></Section>
    </div>
  );
}
