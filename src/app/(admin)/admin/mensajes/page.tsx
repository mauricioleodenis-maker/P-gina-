import type { Metadata } from 'next';
import { requireAdmin } from '@/modules/auth/api';
import { listContactMessages, listDataRequests } from '@/modules/dashboard/api';
import { DataRequestInbox, ErrorState, InboxTabs, MessageInbox } from '@/components/admin/dashboard';

export const metadata: Metadata = { title: 'Mensajes' };

export default async function MensajesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab } = await searchParams;
  const active = tab === 'derechos' ? 'derechos' : 'contacto';
  const [messages, requests] = await Promise.all([
    listContactMessages().then((value) => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
    listDataRequests().then((value) => ({ ok: true as const, value })).catch(() => ({ ok: false as const })),
  ]);
  const counts = {
    contacto: messages.ok ? messages.value.filter((m) => !m.handled).length : 0,
    derechos: requests.ok ? requests.value.filter((r) => r.urgency !== 'closed').length : 0,
  };
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-serif text-3xl">Mensajes</h1>
        <p className="text-ink-soft">Contacto de la web y solicitudes de derechos de proteccion de datos.</p>
      </header>
      <InboxTabs active={active} counts={counts} />
      {active === 'contacto' ? (
        messages.ok ? <MessageInbox messages={messages.value} /> : <ErrorState>No se pudieron cargar los mensajes.</ErrorState>
      ) : requests.ok ? (
        <DataRequestInbox requests={requests.value} />
      ) : (
        <ErrorState>No se pudieron cargar las solicitudes.</ErrorState>
      )}
    </div>
  );
}
