import type { Metadata } from 'next';
import { CalendarView } from '@/components/admin/calendar';
import { getRange, isDay, isView, todayMadrid, type View } from '@/components/admin/calendar/range';
import { requireAdmin } from '@/modules/auth/api';
import { listAppointments, listBlocks, listFormOptions } from '@/modules/appointments/service';

export const metadata: Metadata = { title: 'Calendario' };
export const dynamic = 'force-dynamic';

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const view: View = isView(sp.view) ? sp.view : 'week';
  const day = isDay(sp.date) ? sp.date : todayMadrid();
  const { from, to } = getRange(view, day);
  const [appointments, blocks, options] = await Promise.all([listAppointments({ from, to }), listBlocks({ from, to }), listFormOptions()]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-3xl">Calendario</h1>
        <p className="text-ink-soft">Citas, series y huecos. Horas en Europa/Madrid.</p>
      </header>
      <CalendarView view={view} day={day} explicitView={isView(sp.view)} appointments={appointments} blocks={blocks} options={options} />
    </div>
  );
}
