import type { Metadata } from 'next';
import Link from 'next/link';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { listAuditLog } from '@/modules/settings/api';
import { Section } from '../_components/FormParts';

export const metadata: Metadata = { title: 'Auditoria' };

const PAGE = 50;
const fmt = (iso: string) => new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Madrid' }).format(new Date(iso));

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string; table?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page ?? 0) || 0, 0);
  const { rows, total } = await listAuditLog({ page, pageSize: PAGE, action: sp.action || undefined, table: sp.table || undefined });
  const q = (p: number) => {
    const u = new URLSearchParams();
    if (sp.action) u.set('action', sp.action);
    if (sp.table) u.set('table', sp.table);
    u.set('page', String(p));
    return `/admin/ajustes/auditoria?${u}`;
  };
  return (
    <Section title="Registro de auditoria" hint="Solo lectura y no modificable. No contiene contenido clinico. Se conserva 2 anios.">
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <label className="grid gap-1 text-sm">Accion
          <input name="action" defaultValue={sp.action ?? ''} placeholder="login, export..." className="min-h-11 rounded-md border border-sand bg-white px-3" />
        </label>
        <label className="grid gap-1 text-sm">Tabla
          <input name="table" defaultValue={sp.table ?? ''} placeholder="patients..." className="min-h-11 rounded-md border border-sand bg-white px-3" />
        </label>
        <button type="submit" className="min-h-11 rounded-full border border-sand px-5 hover:bg-bg">Filtrar</button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-sand p-6 text-center text-ink-soft">Sin eventos con estos filtros.</p>
      ) : (
        <Table caption="Eventos de auditoria">
          <THead><TR><TH>Fecha (Madrid)</TH><TH>Accion</TH><TH>Tabla</TH><TH>Registro</TH><TH>Resultado</TH></TR></THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="tabular whitespace-nowrap">{fmt(r.at)}</TD>
                <TD>{r.action}</TD>
                <TD>{r.table_name}</TD>
                <TD className="max-w-40 truncate font-mono text-xs">{r.row_id ?? '-'}</TD>
                <TD>{r.result ?? '-'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <nav aria-label="Paginacion" className="mt-4 flex items-center justify-between text-sm">
        {page > 0 ? <Link className="min-h-11 py-3 underline underline-offset-4" href={q(page - 1)}>Anterior</Link> : <span />}
        <span className="tabular text-ink-soft">{total === 0 ? 0 : page * PAGE + 1}-{Math.min((page + 1) * PAGE, total)} de {total}</span>
        {(page + 1) * PAGE < total ? <Link className="min-h-11 py-3 underline underline-offset-4" href={q(page + 1)}>Siguiente</Link> : <span />}
      </nav>
    </Section>
  );
}
