import type { InvoiceStatus, PaymentMethod, PaymentStatus } from '@/types/database';

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  bizum: 'Bizum',
  stripe: 'Pasarela online',
  other: 'Otro',
};
/** Metodos que ofrece el formulario manual (v1 sin pagos online). */
export const MANUAL_METHODS: PaymentMethod[] = ['cash', 'transfer', 'bizum', 'card', 'other'];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Cobrado',
  refunded: 'Reembolsado',
  failed: 'Fallido',
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  void: 'Anulada',
};

export type PaymentListItem = {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  serviceName: string | null;
  refundOf: string | null;
  amountCents: number;
  /** Ya reembolsado de este cobro (solo en cobros 'paid'). */
  refundedCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  concept: string | null;
  createdAt: string;
};

export type PendingCharge = {
  key: string;
  appointmentId: string | null;
  pendingPaymentId: string | null;
  patientId: string;
  patientName: string;
  serviceName: string | null;
  startsAt: string | null;
  priceCents: number;
  paidCents: number;
  balanceCents: number;
  ageDays: number;
};

export type RevenuePoint = { period: string; incomeCents: number; paymentsCount: number };

export type InvoiceListItem = {
  id: string;
  number: string;
  patientId: string;
  patientName: string;
  issuedOn: string;
  subtotalCents: number;
  vatCents: number;
  vatRate: number;
  totalCents: number;
  status: InvoiceStatus;
  concept: string;
  rectifiesId: string | null;
  rectifiesNumber: string | null;
  hasPdf: boolean;
};

export type BillablePayment = { id: string; amountCents: number; concept: string | null; paidAt: string | null; method: PaymentMethod };

/** Instantanea fiscal congelada al emitir (invoices.fiscal_snapshot). */
export type FiscalSnapshot = {
  issuer: {
    name: string;
    legalName: string | null;
    nif: string | null;
    address: string | null;
    collegeNumber: string | null;
    phone: string | null;
    email: string | null;
  };
  receiver: { name: string; nif: string | null; address: string | null };
  vatExemptionText: string | null;
  footer: string | null;
  /** Texto legal de la rectificativa (numero y motivo). */
  rectification?: { originalNumber: string; reason: string } | null;
};

export type Breakdown = { label: string; cents: number };

export type RevenueReport = {
  year: number;
  months: { month: number; label: string; current: number; previous: number }[];
  totalCurrent: number;
  totalPrevious: number;
  variationPct: number | null;
  byMethod: Breakdown[];
  byService: Breakdown[];
  currentMonthCents: number;
  previousMonthCents: number;
};
