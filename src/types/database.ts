/**
 * Tipos de BD, escritos a mano y coherentes con supabase/migrations/0001_init.sql (C28).
 * Si hay Supabase CLI: `supabase gen types typescript --local > src/types/database.ts`
 * (y reanadir los alias de abajo). Cualquier cambio de esquema debe reflejarse aqui.
 * Nota: `bytea` viaja por PostgREST como string hexadecimal ("\\x...").
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Helpers: Insert = columnas obligatorias + resto opcional; Update = todo opcional.
type Ins<Row, Required extends keyof Row = never> = Pick<Row, Required> & Partial<Omit<Row, Required>>;
type Upd<Row> = Partial<Row>;

export type Modality = 'in_person' | 'online';
export type ServiceModality = 'in_person' | 'online' | 'both';
export type AppointmentStatus = 'requested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'bizum' | 'stripe' | 'other';
export type PatientStatus = 'active' | 'paused' | 'discharged';
export type InvoiceStatus = 'draft' | 'issued' | 'void';
export type ConsentPurpose =
  | 'privacy_policy' | 'health_data' | 'informed_consent' | 'reminders' | 'marketing' | 'whatsapp';
export type DataRequestType =
  | 'access' | 'rectification' | 'erasure' | 'objection' | 'restriction' | 'portability' | 'withdrawal';
export type DataRequestStatus = 'received' | 'in_progress' | 'resolved' | 'rejected';
export type NoteTemplate = 'free' | 'soap';
export type ProfileRole = 'admin' | 'assistant';

export interface Guardian {
  name: string;
  relationship?: string;
  email?: string;
  phone?: string;
  national_id?: string;
}

export interface ProfileRow { id: string; role: ProfileRole; full_name: string | null; created_at: string; updated_at: string }

export interface PracticeSettingsRow {
  id: boolean; business_name: string; legal_name: string | null; nif: string | null; address: string | null;
  college_number: string | null; phone: string | null; contact_email: string | null; timezone: string;
  slot_step_min: number; buffer_min: number; min_notice_hours: number; max_advance_days: number;
  cancellation_hours: number; auto_confirm: boolean; recurrence_weeks: number; invoice_series: string;
  default_vat_rate: number; vat_exemption_text: string | null; invoice_footer: string | null; updated_at: string;
}

export interface ServiceRow {
  id: string; slug: string; name: string; description: string | null; duration_min: number; price_cents: number;
  currency: string; modality: ServiceModality; active: boolean; sort_order: number; created_at: string; updated_at: string;
}

export interface PatientRow {
  id: string; full_name: string; email: string | null; phone: string | null; birth_date: string | null;
  national_id: string | null; address: string | null; emergency_contact: string | null; guardian: Guardian | null;
  modality: Modality; default_price_cents: number | null; tags: string[]; status: PatientStatus; restricted: boolean;
  consent_data: boolean; consent_data_at: string | null; consent_marketing: boolean; internal_notes: string | null;
  deleted_at: string | null; anonymized_at: string | null; created_at: string; updated_at: string;
}

export interface AppointmentSeriesRow {
  id: string; patient_id: string; service_id: string; rrule: string; dtstart: string; duration_min: number;
  until: string | null; tz: string; modality: Modality; price_cents: number | null; materialized_until: string | null;
  active: boolean; created_at: string; updated_at: string;
}

export interface AppointmentRow {
  id: string; patient_id: string | null; service_id: string; series_id: string | null; starts_at: string; ends_at: string;
  /** columna generada (tstzrange); solo lectura */
  period: string; status: AppointmentStatus; modality: Modality; meeting_url: string | null; price_cents: number | null;
  is_exception: boolean; internal_note: string | null; requester_name: string | null; requester_email: string | null;
  requester_phone: string | null; requester_note: string | null; requester_guardian: Guardian | null;
  manage_token_hash: string | null; cancel_reason: string | null; reminder_sent_at: string | null;
  created_at: string; updated_at: string;
}

export interface SessionNoteRow {
  id: string; patient_id: string; appointment_id: string | null; template: NoteTemplate;
  /** AES-256-GCM, hex "\\x..." (nonce||ciphertext||tag). Ver src/lib/crypto */
  body_enc: string; key_version: number; created_by: string | null; created_at: string; updated_at: string;
}

export interface SessionNoteVersionRow {
  id: string; note_id: string; body_enc: string; key_version: number; saved_at: string; saved_by: string | null;
}

export interface InvoiceCounterRow { series: string; year: number; last_number: number }

export interface InvoiceRow {
  id: string; series: string; year: number; seq_no: number; number: string; patient_id: string;
  rectifies_id: string | null; issued_on: string; subtotal_cents: number; vat_rate: number; vat_cents: number;
  total_cents: number; currency: string; status: InvoiceStatus; concept: string; fiscal_snapshot: Json | null;
  pdf_path: string | null; created_at: string; updated_at: string;
}

export interface PaymentRow {
  id: string; patient_id: string; appointment_id: string | null; invoice_id: string | null; service_id: string | null;
  refund_of: string | null; amount_cents: number; currency: string; method: PaymentMethod; status: PaymentStatus;
  paid_at: string | null; external_ref: string | null; concept: string | null; created_at: string; updated_at: string;
}

export interface AvailabilityRuleRow {
  id: string; weekday: number; start_time: string; end_time: string; modality: ServiceModality; active: boolean;
}

export interface AvailabilityExceptionRow {
  id: string; starts_on: string; ends_on: string; is_closed: boolean; start_time: string | null; end_time: string | null;
  reason: string | null; created_at: string;
}

export interface ContactMessageRow {
  id: string; name: string; email: string; phone: string | null; message: string; consent: boolean;
  handled: boolean; created_at: string;
}

export interface ConsentRow {
  id: string; patient_id: string | null; appointment_id: string | null; purpose: ConsentPurpose; text_version: string;
  given_at: string; ip_hash: string | null; document_path: string | null; withdrawn_at: string | null;
}

export interface DataRequestRow {
  id: string; patient_id: string | null; requester_name: string; requester_email: string; type: DataRequestType;
  status: DataRequestStatus; received_at: string; due_at: string; resolution: string | null;
  resolved_at: string | null; created_at: string;
}

export interface AuditLogRow {
  id: number; actor: string | null; table_name: string; row_id: string | null; action: string; at: string;
  ip_hash: string | null; result: string | null; meta: Json | null;
}

export interface IncomeMonthlyRow {
  month: string | null; service_id: string | null; payments_count: number | null; income_cents: number | null;
}

type Rel = never[];

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Ins<ProfileRow, 'id'>; Update: Upd<ProfileRow>; Relationships: Rel };
      practice_settings: { Row: PracticeSettingsRow; Insert: Ins<PracticeSettingsRow>; Update: Upd<PracticeSettingsRow>; Relationships: Rel };
      services: { Row: ServiceRow; Insert: Ins<ServiceRow, 'slug' | 'name' | 'duration_min' | 'price_cents'>; Update: Upd<ServiceRow>; Relationships: Rel };
      patients: { Row: PatientRow; Insert: Ins<PatientRow, 'full_name'>; Update: Upd<PatientRow>; Relationships: Rel };
      appointment_series: {
        Row: AppointmentSeriesRow;
        Insert: Ins<AppointmentSeriesRow, 'patient_id' | 'service_id' | 'rrule' | 'dtstart' | 'duration_min'>;
        Update: Upd<AppointmentSeriesRow>; Relationships: Rel;
      };
      appointments: {
        Row: AppointmentRow;
        Insert: Ins<Omit<AppointmentRow, 'period'>, 'service_id' | 'starts_at' | 'ends_at'>;
        Update: Upd<Omit<AppointmentRow, 'period'>>; Relationships: Rel;
      };
      session_notes: {
        Row: SessionNoteRow; Insert: Ins<SessionNoteRow, 'patient_id' | 'body_enc'>; Update: Upd<SessionNoteRow>; Relationships: Rel;
      };
      session_note_versions: {
        Row: SessionNoteVersionRow; Insert: Ins<SessionNoteVersionRow, 'note_id' | 'body_enc' | 'key_version'>;
        Update: Upd<SessionNoteVersionRow>; Relationships: Rel;
      };
      /** Solo lectura para `authenticated`: lo escribe issue_invoice. */
      invoice_counters: { Row: InvoiceCounterRow; Insert: Ins<InvoiceCounterRow, 'series' | 'year'>; Update: Upd<InvoiceCounterRow>; Relationships: Rel };
      invoices: {
        Row: InvoiceRow;
        Insert: Ins<InvoiceRow, 'year' | 'seq_no' | 'number' | 'patient_id' | 'subtotal_cents' | 'total_cents' | 'concept'>;
        Update: Upd<InvoiceRow>; Relationships: Rel;
      };
      payments: { Row: PaymentRow; Insert: Ins<PaymentRow, 'patient_id' | 'amount_cents'>; Update: Upd<PaymentRow>; Relationships: Rel };
      availability_rules: {
        Row: AvailabilityRuleRow; Insert: Ins<AvailabilityRuleRow, 'weekday' | 'start_time' | 'end_time'>;
        Update: Upd<AvailabilityRuleRow>; Relationships: Rel;
      };
      availability_exceptions: {
        Row: AvailabilityExceptionRow; Insert: Ins<AvailabilityExceptionRow, 'starts_on' | 'ends_on'>;
        Update: Upd<AvailabilityExceptionRow>; Relationships: Rel;
      };
      contact_messages: {
        Row: ContactMessageRow; Insert: Ins<ContactMessageRow, 'name' | 'email' | 'message' | 'consent'>;
        Update: Upd<ContactMessageRow>; Relationships: Rel;
      };
      consents: { Row: ConsentRow; Insert: Ins<ConsentRow, 'purpose' | 'text_version'>; Update: Upd<ConsentRow>; Relationships: Rel };
      data_requests: {
        Row: DataRequestRow; Insert: Ins<DataRequestRow, 'requester_name' | 'requester_email' | 'type'>;
        Update: Upd<DataRequestRow>; Relationships: Rel;
      };
      /** Append-only: sin UPDATE/DELETE. */
      audit_log: { Row: AuditLogRow; Insert: Ins<AuditLogRow, 'table_name' | 'action'>; Update: never; Relationships: Rel };
    };
    Views: {
      v_income_monthly: { Row: IncomeMonthlyRow; Relationships: Rel };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      /** Solo service_role. */
      busy_slots: { Args: { p_from: string; p_to: string }; Returns: { starts_at: string; ends_at: string }[] };
      /** Solo service_role (Route Handler con Turnstile + rate limit). Errores: consent_required, too_soon, too_far, invalid_service, invalid_email, invalid_name, invalid_modality; solape = SQLSTATE 23P01. */
      request_appointment: {
        Args: {
          p_service: string; p_starts: string; p_name: string; p_email: string; p_phone: string | null;
          p_modality: Modality | null; p_consent_privacy: boolean; p_consent_health: boolean;
          p_consent_reminders: boolean; p_note: string | null; p_guardian: Json | null;
          p_token_hash: string; p_ip_hash: string | null; p_text_version: string;
        };
        Returns: string;
      };
      /** admin aal2. Numero correlativo sin huecos. Errores: forbidden, invalid_series, invalid_amount. */
      issue_invoice: {
        Args: {
          p_patient: string; p_concept: string; p_subtotal_cents: number; p_vat_rate: number;
          p_payment_ids?: string[]; p_series?: string; p_rectifies?: string | null; p_snapshot?: Json | null;
        };
        Returns: string;
      };
      f_unaccent: { Args: { '': string }; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type TableName = keyof PublicSchema['Tables'];
export type Tables<T extends TableName> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends TableName> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends TableName> = PublicSchema['Tables'][T]['Update'];
