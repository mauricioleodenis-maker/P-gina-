import type { DataRequestStatus, DataRequestType } from '@/types/database';

/** Un valor que puede haber fallado de forma aislada (cada tarjeta gestiona su propio error). */
export type Loaded<T> = { ok: true; value: T } | { ok: false };

export type UpcomingItem = {
  id: string;
  startsAt: string;
  name: string;
  serviceName: string;
  modality: string;
  status: string;
};

export type DashboardKpis = {
  appointmentsToday: Loaded<number>;
  /** Ingresos netos del mes en curso y del anterior, en centimos. */
  incomeMonth: Loaded<{ cents: number; previousCents: number }>;
  activePatients: Loaded<number>;
  pendingCharges: Loaded<{ count: number; balanceCents: number }>;
  nextAppointment: Loaded<UpcomingItem | null>;
  newRequests: Loaded<number>;
};

export type DashboardAlert = {
  key: string;
  tone: 'warn' | 'danger';
  text: string;
  href: string;
  cta: string;
};

export type ContactMessageItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
};

export type DataRequestItem = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  type: DataRequestType;
  status: DataRequestStatus;
  receivedAt: string;
  dueAt: string;
  resolution: string | null;
  patientId: string | null;
  /** Dias hasta el vencimiento (negativo = vencida). null si ya esta cerrada. */
  daysLeft: number | null;
  /** 'overdue' vencida, 'soon' <= 7 dias, 'ok' resto, 'closed' cerrada. */
  urgency: 'overdue' | 'soon' | 'ok' | 'closed';
};
