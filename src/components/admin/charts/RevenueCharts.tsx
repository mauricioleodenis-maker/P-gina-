'use client';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCents } from '@/lib/money';
import type { Breakdown, RevenueReport } from '@/modules/billing/types';

const C = { current: '#5f7a64', previous: '#c9b79c', grid: '#e3d3bd', text: '#5e544b' };
const eur = (v: number) => formatCents(v);
const axisEur = (v: number) => `${Math.round(v / 100)} €`;

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="min-h-11 cursor-pointer py-2 text-ink-soft underline-offset-4 hover:underline">Ver como tabla</summary>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead><tr>{head.map((h, i) => <th key={h} scope="col" className={`py-1.5 pr-4 font-medium ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r[0])} className="border-t border-sand/70">
                {r.map((c, i) => <td key={i} className={`py-1.5 pr-4 ${i ? 'tabular text-right' : ''}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Panel({ title, summary, children }: { title: string; summary: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-sand/70 bg-surface p-5" aria-label={title}>
      <h2 className="font-serif text-xl">{title}</h2>
      <p className="sr-only">{summary}</p>
      {children}
    </section>
  );
}

function BreakdownChart({ title, data, empty }: { title: string; data: Breakdown[]; empty: string }) {
  const summary = data.length ? `${title}: ${data.map((d) => `${d.label} ${eur(d.cents)}`).join(', ')}` : empty;
  return (
    <Panel title={title} summary={summary}>
      {data.length === 0 ? (
        <p className="mt-4 text-ink-soft">{empty}</p>
      ) : (
        <>
          <div className="mt-3 h-64" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={C.grid} />
                <XAxis type="number" tickFormatter={axisEur} stroke={C.text} fontSize={12} />
                <YAxis type="category" dataKey="label" width={110} stroke={C.text} fontSize={12} />
                <Tooltip formatter={(v) => eur(Number(v))} />
                <Bar dataKey="cents" name="Ingresos" fill={C.current} radius={[0, 6, 6, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DataTable caption={title} head={['Concepto', 'Ingresos']} rows={data.map((d) => [d.label, eur(d.cents)])} />
        </>
      )}
    </Panel>
  );
}

export function RevenueCharts({ report }: { report: RevenueReport }) {
  const months = report.months.map((m) => ({ ...m, name: m.label.slice(0, 3) }));
  const hasData = report.totalCurrent !== 0 || report.totalPrevious !== 0;
  return (
    <div className="grid gap-6">
      <Panel
        title={`Ingresos por mes, ${report.year} frente a ${report.year - 1}`}
        summary={`Total ${report.year}: ${eur(report.totalCurrent)}. Total ${report.year - 1}: ${eur(report.totalPrevious)}.`}
      >
        {!hasData ? (
          <p className="mt-4 text-ink-soft">Todavia no hay cobros registrados en estos anios.</p>
        ) : (
          <>
            <div className="mt-3 h-72" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} />
                  <XAxis dataKey="name" stroke={C.text} fontSize={12} />
                  <YAxis tickFormatter={axisEur} stroke={C.text} fontSize={12} width={56} />
                  <Tooltip formatter={(v) => eur(Number(v))} />
                  <Legend />
                  <Bar dataKey="previous" name={String(report.year - 1)} fill={C.previous} radius={[4, 4, 0, 0]} animationDuration={600} />
                  <Bar dataKey="current" name={String(report.year)} fill={C.current} radius={[4, 4, 0, 0]} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DataTable
              caption="Ingresos mensuales"
              head={['Mes', String(report.year), String(report.year - 1)]}
              rows={report.months.map((m) => [m.label, eur(m.current), eur(m.previous)])}
            />
          </>
        )}
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownChart title="Por metodo de pago" data={report.byMethod} empty="Sin cobros este anio." />
        <BreakdownChart title="Por servicio" data={report.byService} empty="Sin cobros este anio." />
      </div>
    </div>
  );
}
