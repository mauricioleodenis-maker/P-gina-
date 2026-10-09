import type { Guardian, Modality, PatientRow, PatientStatus, NoteTemplate, ConsentPurpose } from '@/types/database';

export type { Guardian, Modality, PatientStatus, NoteTemplate, ConsentPurpose };

/** Fila de lista: solo lo necesario, sin datos clinicos. */
export type PatientListItem = Pick<
  PatientRow,
  'id' | 'full_name' | 'email' | 'phone' | 'status' | 'modality' | 'tags' | 'birth_date' | 'guardian' | 'restricted' | 'created_at'
>;

export type PatientDetail = PatientRow;

export type NoteMeta = {
  id: string;
  template: NoteTemplate;
  appointmentId: string | null;
  createdAt: string;
  updatedAt: string;
  keyVersion: number;
};

export type NoteFull = NoteMeta & { body: string };

export type NoteVersionMeta = { id: string; savedAt: string; keyVersion: number };

export type TimelineEvent = {
  id: string;
  at: string;
  kind: 'appointment' | 'note' | 'consent';
  title: string;
  detail?: string;
  href?: string;
};

export const STATUS_LABEL: Record<PatientStatus, string> = {
  active: 'Activo',
  paused: 'En pausa',
  discharged: 'Alta',
};
export const MODALITY_LABEL: Record<Modality, string> = { in_person: 'Presencial', online: 'Online' };
export const TEMPLATE_LABEL: Record<NoteTemplate, string> = { free: 'Libre', soap: 'SOAP' };
export const PURPOSE_LABEL: Record<ConsentPurpose, string> = {
  privacy_policy: 'Politica de privacidad',
  health_data: 'Tratamiento de datos de salud',
  informed_consent: 'Consentimiento informado',
  reminders: 'Recordatorios',
  marketing: 'Comunicaciones comerciales',
  whatsapp: 'Contacto por WhatsApp',
};
export const APPT_STATUS_LABEL: Record<string, string> = {
  requested: 'Pendiente',
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
};
export const REQUEST_TYPE_LABEL: Record<string, string> = {
  access: 'Acceso',
  rectification: 'Rectificacion',
  erasure: 'Supresion',
  objection: 'Oposicion',
  restriction: 'Limitacion',
  portability: 'Portabilidad',
  withdrawal: 'Retirada de consentimiento',
};
