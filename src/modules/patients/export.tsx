import 'server-only';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { db } from './db';
import { logAudit } from '@/lib/audit';
import { decryptNote } from '@/lib/crypto';
import { formatMadrid } from '@/lib/dates';

export type PatientExport = {
  generatedAt: string;
  patient: Record<string, unknown>;
  appointments: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  consents: Record<string, unknown>[];
  dataRequests: Record<string, unknown>[];
  notes: { id: string; template: string; createdAt: string; updatedAt: string; body: string | null }[];
};

/** Recopila todo lo del paciente (portabilidad/acceso). Descifra notas y audita la exportacion. */
export async function buildPatientExport(patientId: string): Promise<PatientExport | null> {
  const supabase = await db();
  const { data: patient } = await supabase.from('patients').select('*').eq('id', patientId).maybeSingle();
  if (!patient) return null;
  const [appts, pays, cons, reqs, notes] = await Promise.all([
    supabase.from('appointments').select('id,starts_at,ends_at,status,modality,price_cents').eq('patient_id', patientId).order('starts_at'),
    supabase.from('payments').select('id,amount_cents,currency,method,status,paid_at,concept').eq('patient_id', patientId).order('created_at'),
    supabase.from('consents').select('id,purpose,text_version,given_at,withdrawn_at').eq('patient_id', patientId).order('given_at'),
    supabase.from('data_requests').select('id,type,status,received_at,due_at,resolution,resolved_at').eq('patient_id', patientId).order('received_at'),
    supabase.from('session_notes').select('id,template,created_at,updated_at,body_enc,key_version').eq('patient_id', patientId).order('created_at'),
  ]);
  const out: PatientExport = {
    generatedAt: new Date().toISOString(),
    patient: patient as Record<string, unknown>,
    appointments: (appts.data ?? []) as Record<string, unknown>[],
    payments: (pays.data ?? []) as Record<string, unknown>[],
    consents: (cons.data ?? []) as Record<string, unknown>[],
    dataRequests: (reqs.data ?? []) as Record<string, unknown>[],
    notes: (notes.data ?? []).map((n) => {
      let body: string | null = null;
      try {
        body = decryptNote(n.body_enc as string, n.key_version as number, { patientId });
      } catch {
        body = null; // no filtrar detalles del error
      }
      return { id: n.id as string, template: n.template as string, createdAt: n.created_at as string, updatedAt: n.updated_at as string, body };
    }),
  };
  await logAudit({ action: 'export', table: 'patients', rowId: patientId, meta: { notes: out.notes.length } });
  return out;
}

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#2B2622' },
  h1: { fontSize: 18, marginBottom: 4 },
  h2: { fontSize: 12, marginTop: 16, marginBottom: 6, borderBottom: '1pt solid #E3D3BD', paddingBottom: 2 },
  muted: { color: '#5E544B', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 2 },
  k: { width: 130, color: '#5E544B' },
  note: { marginBottom: 10 },
});

const fmt = (v: unknown) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatMadrid(new Date(v));
  if (Array.isArray(v)) return v.join(', ') || '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const PATIENT_FIELDS: [string, string][] = [
  ['full_name', 'Nombre'], ['email', 'Correo'], ['phone', 'Telefono'], ['birth_date', 'Nacimiento'],
  ['national_id', 'DNI/NIE'], ['address', 'Direccion'], ['emergency_contact', 'Contacto emergencia'],
  ['guardian', 'Tutor/a'], ['status', 'Estado'], ['modality', 'Modalidad'],
];

export async function renderPatientPdf(d: PatientExport): Promise<Buffer> {
  const doc = (
    <Document title="Exportacion de datos del paciente">
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Exportacion de datos del paciente</Text>
        <Text style={s.muted}>Generado el {formatMadrid(new Date(d.generatedAt))} (Europe/Madrid). Documento confidencial: datos de salud.</Text>
        <Text style={s.h2}>Datos personales</Text>
        {PATIENT_FIELDS.map(([k, label]) => (
          <View key={k} style={s.row}><Text style={s.k}>{label}</Text><Text>{fmt(d.patient[k])}</Text></View>
        ))}
        <Text style={s.h2}>Sesiones ({d.appointments.length})</Text>
        {d.appointments.map((a) => (
          <View key={String(a.id)} style={s.row}><Text style={s.k}>{fmt(a.starts_at)}</Text><Text>{fmt(a.status)} / {fmt(a.modality)}</Text></View>
        ))}
        <Text style={s.h2}>Consentimientos ({d.consents.length})</Text>
        {d.consents.map((c) => (
          <View key={String(c.id)} style={s.row}><Text style={s.k}>{fmt(c.given_at)}</Text><Text>{fmt(c.purpose)} v{fmt(c.text_version)}{c.withdrawn_at ? ' (retirado)' : ''}</Text></View>
        ))}
        <Text style={s.h2}>Notas clinicas ({d.notes.length})</Text>
        {d.notes.map((n) => (
          <View key={n.id} style={s.note} wrap={false}>
            <Text style={s.muted}>{formatMadrid(new Date(n.createdAt))} - {n.template === 'soap' ? 'SOAP' : 'Libre'}</Text>
            <Text>{n.body ?? '[No se pudo descifrar]'}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
