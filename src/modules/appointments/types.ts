import type { AppointmentStatus, Modality } from '@/types/database';

/** Hueco libre ofrecido a la web publica (ISO UTC). */
export type Slot = { start: string; end: string };

export type Scope = 'one' | 'following' | 'all';
export type Frequency = 'weekly' | 'biweekly' | 'monthly';

/** Cita lista para pintar en el calendario (sin datos clinicos). */
export type AppointmentView = {
  id: string;
  patientId: string | null;
  /** Paciente o solicitante. */
  name: string;
  serviceId: string;
  serviceName: string;
  seriesId: string | null;
  isException: boolean;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  modality: Modality;
  priceCents: number | null;
  internalNote: string | null;
  meetingUrl: string | null;
};

export type BlockView = { id: string; startsOn: string; endsOn: string; isClosed: boolean; startTime: string | null; endTime: string | null };

export type RequestView = {
  id: string;
  startsAt: string;
  endsAt: string;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  guardianName: string | null;
  serviceName: string;
  modality: Modality;
  createdAt: string;
};

export type CreateAppointmentInput = {
  patientId: string;
  serviceId: string;
  startsAt: string;
  durationMin?: number;
  modality?: Modality;
  status?: Extract<AppointmentStatus, 'scheduled' | 'confirmed'>;
  priceCents?: number | null;
  internalNote?: string | null;
  meetingUrl?: string | null;
  recurrence?: { frequency: Frequency; count?: number; until?: string };
};

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: 'Pendiente',
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
};

/** Error de dominio con codigo estable para la UI. */
export class AppointmentError extends Error {
  constructor(public code: 'overlap' | 'not_found' | 'invalid' | 'forbidden' | 'server', message: string) {
    super(message);
  }
}
