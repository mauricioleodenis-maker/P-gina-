import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatCents } from '@/lib/money';
import type { FiscalSnapshot } from '../types';

export type InvoicePdfData = {
  number: string;
  issuedOn: string; // yyyy-MM-dd
  concept: string;
  subtotalCents: number;
  vatRate: number;
  vatCents: number;
  totalCents: number;
  isRectification: boolean;
  snapshot: FiscalSnapshot;
};

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: '#2B2622', fontFamily: 'Helvetica' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  h1: { fontSize: 20, marginBottom: 4 },
  muted: { color: '#5E544B' },
  block: { marginTop: 24 },
  label: { fontSize: 8, color: '#5E544B', textTransform: 'uppercase', marginBottom: 3 },
  th: { backgroundColor: '#F2EBE1', padding: 6, flexDirection: 'row', fontSize: 9 },
  tr: { padding: 6, flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E3D3BD' },
  num: { width: 90, textAlign: 'right' },
  totals: { marginTop: 14, alignSelf: 'flex-end', width: 220 },
  total: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  foot: { position: 'absolute', bottom: 36, left: 48, right: 48, fontSize: 8, color: '#5E544B' },
});

const dmy = (iso: string) => iso.split('-').reverse().join('/');
const TODO = 'TODO_REAL';

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { snapshot: f } = data;
  const exempt = data.vatRate === 0;
  return (
    <Document title={`Factura ${data.number}`} author={f.issuer.name} subject="Factura">
      <Page size="A4" style={s.page}>
        <View style={s.row}>
          <View>
            <Text style={s.h1}>{data.isRectification ? 'Factura rectificativa' : 'Factura'}</Text>
            <Text>N.o {data.number}</Text>
            <Text style={s.muted}>Fecha: {dmy(data.issuedOn)}</Text>
            {f.rectification ? (
              <Text style={s.muted}>
                Rectifica la factura {f.rectification.originalNumber}. Motivo: {f.rectification.reason}
              </Text>
            ) : null}
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>{f.issuer.legalName || f.issuer.name}</Text>
            <Text style={s.muted}>NIF: {f.issuer.nif || TODO}</Text>
            <Text style={s.muted}>{f.issuer.address || `Direccion ${TODO}`}</Text>
            <Text style={s.muted}>N.o colegiada: {f.issuer.collegeNumber || TODO}</Text>
            {f.issuer.email ? <Text style={s.muted}>{f.issuer.email}</Text> : null}
            {f.issuer.phone ? <Text style={s.muted}>{f.issuer.phone}</Text> : null}
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.label}>Cliente</Text>
          <Text>{f.receiver.name}</Text>
          {f.receiver.nif ? <Text style={s.muted}>NIF/DNI: {f.receiver.nif}</Text> : null}
          {f.receiver.address ? <Text style={s.muted}>{f.receiver.address}</Text> : null}
        </View>

        <View style={s.block}>
          <View style={s.th}>
            <Text style={{ flex: 1 }}>Concepto</Text>
            <Text style={s.num}>{data.isRectification ? 'Importe a abonar' : 'Base imponible'}</Text>
          </View>
          <View style={s.tr}>
            <Text style={{ flex: 1 }}>{data.concept}</Text>
            <Text style={s.num}>{formatCents(data.subtotalCents)}</Text>
          </View>
        </View>

        <View style={s.totals}>
          <View style={s.row}>
            <Text>Base imponible</Text>
            <Text>{formatCents(data.subtotalCents)}</Text>
          </View>
          <View style={s.row}>
            <Text>{exempt ? 'IVA (exento)' : `IVA ${data.vatRate}%`}</Text>
            <Text>{formatCents(data.vatCents)}</Text>
          </View>
          <View style={[s.row, s.total]}>
            <Text>{data.isRectification ? 'Total a abonar' : 'Total'}</Text>
            <Text>{formatCents(data.totalCents)}</Text>
          </View>
        </View>

        {exempt ? (
          <View style={s.block}>
            <Text style={s.muted}>{f.vatExemptionText || `Mencion de exencion de IVA: ${TODO} (confirmar con el gestor)`}</Text>
          </View>
        ) : null}

        <Text style={s.foot} fixed>
          {f.footer || `Pie legal de factura: ${TODO}`}
        </Text>
      </Page>
    </Document>
  );
}
