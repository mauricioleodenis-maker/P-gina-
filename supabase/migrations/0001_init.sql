-- =====================================================================
-- 0001_init.sql  -  Caromafla (consulta de psicologia)  -  VERSION FINAL
-- Base: docs/plan/03-datos.md, corregida segun docs/plan/PLAN.md (seccion 2).
-- Cambios clave frente a 03: reserva/contacto SOLO via service_role (captcha +
-- rate limit en Route Handler), aal2 exigido en is_admin(), facturacion sin
-- huecos (contador + issue_invoice), consents/data_requests/practice_settings,
-- audit_log append-only, sin blog_posts (blog = MDX en v1), sin anon en nada
-- salvo lectura de servicios activos.
-- Datos reales = TODO (ver docs/plan/PLAN.md). Zona horaria: Europe/Madrid.
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;   -- EXCLUDE anti-solape
create extension if not exists pg_trgm;      -- busqueda por nombre
create extension if not exists citext;
create extension if not exists unaccent;     -- busqueda sin acentos

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- busqueda sin acentos (unaccent no es IMMUTABLE: envoltorio para poder indexar)
create or replace function public.f_unaccent(text) returns text
language sql immutable parallel safe strict as $$
  select public.unaccent('public.unaccent'::regdictionary, $1)
$$;

-- ---------- profiles ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'admin' check (role in ('admin','assistant')),
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_upd before update on public.profiles
  for each row execute function public.set_updated_at();

-- is_admin(): rol admin Y sesion MFA (aal2). SECURITY DEFINER evita recursion de RLS.
-- En tests SQL se simula con: set local request.jwt.claims = '{"sub":"<uuid>","aal":"aal2"}'
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------- practice_settings (fila unica) ----------
create table public.practice_settings (
  id                  boolean primary key default true check (id),
  business_name       text not null default 'Caromafla',
  legal_name          text,                 -- TODO_REAL
  nif                 text,                 -- TODO_REAL
  address             text,                 -- TODO_REAL
  college_number      text,                 -- TODO_REAL n. colegiada
  phone               text,                 -- TODO_REAL
  contact_email       text,                 -- TODO_REAL
  timezone            text not null default 'Europe/Madrid',
  slot_step_min       int  not null default 15 check (slot_step_min between 5 and 60),
  buffer_min          int  not null default 10 check (buffer_min >= 0),
  min_notice_hours    int  not null default 12 check (min_notice_hours >= 0),
  max_advance_days    int  not null default 60 check (max_advance_days between 1 and 365),
  cancellation_hours  int  not null default 24,
  auto_confirm        boolean not null default false,
  recurrence_weeks    int  not null default 12 check (recurrence_weeks between 4 and 52),
  invoice_series      text not null default 'F',
  default_vat_rate    numeric(4,2) not null default 0,   -- TODO exencion sanitaria: confirmar con gestor
  vat_exemption_text  text,                               -- TODO mencion legal
  invoice_footer      text,
  updated_at          timestamptz not null default now()
);
create trigger trg_settings_upd before update on public.practice_settings
  for each row execute function public.set_updated_at();
insert into public.practice_settings default values on conflict do nothing;

-- ---------- services ----------
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  duration_min  int  not null check (duration_min between 15 and 240),
  price_cents   int  not null check (price_cents >= 0),   -- 0 = TODO_REAL (la web muestra "consultar")
  currency      char(3) not null default 'EUR',
  modality      text not null default 'both' check (modality in ('in_person','online','both')),
  active        boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_services_upd before update on public.services
  for each row execute function public.set_updated_at();

-- ---------- patients ----------
create table public.patients (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  email             citext,
  phone             text,
  birth_date        date,
  national_id       text,                       -- DNI/NIE (para facturar)
  address           text,
  emergency_contact text,
  guardian          jsonb,                      -- {name,relationship,email,phone,national_id} si menor
  modality          text not null default 'in_person' check (modality in ('in_person','online')),
  default_price_cents int check (default_price_cents is null or default_price_cents >= 0),
  tags              text[] not null default '{}',
  status            text not null default 'active' check (status in ('active','paused','discharged')),
  restricted        boolean not null default false,    -- limitacion del tratamiento (RGPD)
  consent_data      boolean not null default false,    -- consentimiento datos de salud
  consent_data_at   timestamptz,
  consent_marketing boolean not null default false,
  internal_notes    text,                              -- NO clinico (administrativo)
  deleted_at        timestamptz,
  anonymized_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index patients_name_trgm on public.patients using gin (full_name gin_trgm_ops);
create index patients_name_unaccent_trgm on public.patients
  using gin (public.f_unaccent(lower(full_name)) gin_trgm_ops);
create index patients_email_idx on public.patients (email);
create index patients_active_idx on public.patients (status) where deleted_at is null;
create trigger trg_patients_upd before update on public.patients
  for each row execute function public.set_updated_at();

-- ---------- appointment_series (recurrencia, materializada) ----------
create table public.appointment_series (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete restrict,
  service_id   uuid not null references public.services(id),
  rrule        text not null,                  -- RFC 5545: FREQ=WEEKLY;INTERVAL=1;BYDAY=TU
  dtstart      timestamptz not null,
  duration_min int not null check (duration_min > 0),
  until        date,
  tz           text not null default 'Europe/Madrid',
  modality     text not null default 'in_person' check (modality in ('in_person','online')),
  price_cents  int check (price_cents is null or price_cents >= 0),
  materialized_until date,                     -- hasta donde se han generado citas
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index series_patient_idx on public.appointment_series (patient_id);
create trigger trg_series_upd before update on public.appointment_series
  for each row execute function public.set_updated_at();

-- ---------- appointments ----------
create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references public.patients(id) on delete restrict, -- null mientras sea 'requested' sin ficha
  service_id  uuid not null references public.services(id),
  series_id   uuid references public.appointment_series(id) on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  period      tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  status      text not null default 'scheduled'
              check (status in ('requested','scheduled','confirmed','completed','cancelled','no_show')),
  modality    text not null default 'in_person' check (modality in ('in_person','online')),
  meeting_url text,
  price_cents int check (price_cents is null or price_cents >= 0),   -- precio congelado de la sesion
  is_exception boolean not null default false,   -- ocurrencia editada de una serie
  internal_note text,                            -- NO clinico
  -- solicitud publica (patient_id null hasta aceptar)
  requester_name     text,
  requester_email    citext,
  requester_phone    text,
  requester_note     text check (requester_note is null or char_length(requester_note) <= 500), -- sin datos clinicos
  requester_guardian jsonb,
  manage_token_hash  text,                       -- hash del token de cancelar/reprogramar (FR-006)
  cancel_reason      text,
  reminder_sent_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at),
  check (patient_id is not null or requester_email is not null),
  -- sin solapes: toda cita no cancelada ocupa su rango (sin "permitir solape")
  constraint appointments_no_overlap exclude using gist (period with &&)
    where (status <> 'cancelled')
);
create index appt_patient_idx on public.appointments (patient_id, starts_at desc);
create index appt_status_idx  on public.appointments (status, starts_at);
create index appt_series_idx  on public.appointments (series_id) where series_id is not null;
create index appt_token_idx   on public.appointments (manage_token_hash) where manage_token_hash is not null;
create trigger trg_appt_upd before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- session_notes (CLINICO, cifrado en aplicacion) ----------
create table public.session_notes (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid unique references public.appointments(id) on delete set null,
  template       text not null default 'free' check (template in ('free','soap')),
  body_enc       bytea not null,          -- AES-256-GCM: nonce(12) || ciphertext || tag(16); AAD = patient_id
  key_version    smallint not null default 1,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index notes_patient_idx on public.session_notes (patient_id, created_at desc);
create trigger trg_notes_upd before update on public.session_notes
  for each row execute function public.set_updated_at();

-- versionado de ediciones (tambien cifrado)
create table public.session_note_versions (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references public.session_notes(id) on delete cascade,
  body_enc    bytea not null,
  key_version smallint not null,
  saved_at    timestamptz not null default now(),
  saved_by    uuid references public.profiles(id)
);
create index note_versions_idx on public.session_note_versions (note_id, saved_at desc);

-- ---------- facturacion ----------
create table public.invoice_counters (       -- numeracion correlativa SIN huecos
  series       text not null,
  year         int  not null,
  last_number  int  not null default 0,
  primary key (series, year)
);

create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  series         text not null default 'F',
  year           int  not null,
  seq_no         int  not null,
  number         text not null unique,                 -- F-2026-0001 (R = rectificativa)
  patient_id     uuid not null references public.patients(id) on delete restrict,
  rectifies_id   uuid references public.invoices(id),
  issued_on      date not null default (now() at time zone 'Europe/Madrid')::date,
  subtotal_cents int not null check (subtotal_cents >= 0),
  vat_rate       numeric(4,2) not null default 0,
  vat_cents      int not null default 0,
  total_cents    int not null check (total_cents >= 0),
  currency       char(3) not null default 'EUR',
  status         text not null default 'issued' check (status in ('draft','issued','void')),
  concept        text not null,
  fiscal_snapshot jsonb,                  -- datos fiscales emisor/receptor congelados al emitir
  pdf_path       text,                    -- bucket privado 'invoices'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (series, year, seq_no)
);
create index invoices_patient_idx on public.invoices (patient_id);
create index invoices_issued_idx  on public.invoices (issued_on desc);
create trigger trg_invoices_upd before update on public.invoices
  for each row execute function public.set_updated_at();

-- factura emitida = inmutable (correccion por rectificativa); solo pdf_path y anulacion
create or replace function public.invoices_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'invoice_not_deletable'; end if;
    return old;
  end if;
  if old.status <> 'draft' and (
       new.number is distinct from old.number or new.patient_id is distinct from old.patient_id
    or new.series is distinct from old.series or new.year is distinct from old.year
    or new.seq_no is distinct from old.seq_no or new.rectifies_id is distinct from old.rectifies_id
    or new.fiscal_snapshot is distinct from old.fiscal_snapshot or new.currency is distinct from old.currency
    or new.subtotal_cents is distinct from old.subtotal_cents or new.vat_rate is distinct from old.vat_rate
    or new.vat_cents is distinct from old.vat_cents or new.total_cents is distinct from old.total_cents
    or new.concept is distinct from old.concept or new.issued_on is distinct from old.issued_on) then
    raise exception 'invoice_immutable';
  end if;
  return new;
end $$;
create trigger trg_invoices_guard before update or delete on public.invoices
  for each row execute function public.invoices_guard();

-- ---------- payments ----------
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  invoice_id     uuid references public.invoices(id) on delete set null,
  service_id     uuid references public.services(id),
  refund_of      uuid references public.payments(id),   -- reembolso = fila nueva status 'refunded' (importe positivo)
  amount_cents   int not null check (amount_cents > 0),
  currency       char(3) not null default 'EUR',
  method         text not null default 'cash' check (method in ('cash','card','transfer','bizum','stripe','other')),
  status         text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  paid_at        timestamptz,
  external_ref   text,
  concept        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (status not in ('paid','refunded') or paid_at is not null),
  check (status <> 'refunded' or refund_of is not null)
);
create index pay_paid_idx    on public.payments (paid_at) where status in ('paid','refunded');
create index pay_patient_idx on public.payments (patient_id);
create index pay_appt_idx    on public.payments (appointment_id);
create index pay_status_idx  on public.payments (status);
create index pay_invoice_idx on public.payments (invoice_id);
create trigger trg_pay_upd before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- disponibilidad ----------
create table public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  weekday     smallint not null check (weekday between 0 and 6),   -- 0=domingo
  start_time  time not null,
  end_time    time not null,
  modality    text not null default 'both' check (modality in ('in_person','online','both')),
  active      boolean not null default true,
  check (end_time > start_time)
);
create index avail_rules_wd_idx on public.availability_rules (weekday) where active;

create table public.availability_exceptions (   -- vacaciones, festivos, dias extra
  id          uuid primary key default gen_random_uuid(),
  starts_on   date not null,
  ends_on     date not null,
  is_closed   boolean not null default true,
  start_time  time,
  end_time    time,
  reason      text,                    -- interno; nunca se expone en la web
  created_at  timestamptz not null default now(),
  check (ends_on >= starts_on),
  check (is_closed or (start_time is not null and end_time > start_time))
);
create index avail_exc_range_idx on public.availability_exceptions (starts_on, ends_on);

-- ---------- contact_messages (insercion solo via service_role) ----------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       citext not null check (char_length(email) <= 254),
  phone       text check (char_length(phone) <= 30),
  message     text not null check (char_length(message) between 1 and 4000),
  consent     boolean not null check (consent),
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index contact_inbox_idx on public.contact_messages (handled, created_at desc);

-- ---------- consents (versionados) ----------
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,  -- origen: reserva web
  purpose        text not null check (purpose in
                   ('privacy_policy','health_data','informed_consent','reminders','marketing','whatsapp')),
  text_version   text not null,
  given_at       timestamptz not null default now(),
  ip_hash        text,
  document_path  text,                   -- PDF firmado en bucket privado 'consents'
  withdrawn_at   timestamptz
);
create index consents_patient_idx on public.consents (patient_id, purpose);
create index consents_appt_idx on public.consents (appointment_id);

-- ---------- data_requests (derechos RGPD, plazo 1 mes) ----------
create table public.data_requests (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid references public.patients(id) on delete set null,
  requester_name  text not null,
  requester_email citext not null,
  type            text not null check (type in
                    ('access','rectification','erasure','objection','restriction','portability','withdrawal')),
  status          text not null default 'received' check (status in ('received','in_progress','resolved','rejected')),
  received_at     timestamptz not null default now(),
  due_at          timestamptz not null default (now() + interval '1 month'),
  resolution      text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index data_requests_status_idx on public.data_requests (status, due_at);

-- ---------- audit_log (append-only) ----------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid,
  table_name  text not null,
  row_id      uuid,
  action      text not null,             -- insert|update|delete|read_note|read_patient|export|login...
  at          timestamptz not null default now(),
  ip_hash     text,
  result      text,
  meta        jsonb                      -- NUNCA texto clinico ni body_enc
);
create index audit_at_idx on public.audit_log (at desc);

create or replace function public.audit_log_immutable() returns trigger
language plpgsql as $$ begin raise exception 'audit_log is append-only'; end $$;
create trigger trg_audit_immutable before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

create or replace function public.audit_log_no_truncate() returns trigger
language plpgsql as $$ begin raise exception 'audit_log is append-only'; end $$;
create trigger trg_audit_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_no_truncate();

create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(actor, table_name, row_id, action)
  values (auth.uid(), tg_table_name,
          case when tg_op = 'DELETE' then old.id else new.id end,
          lower(tg_op));
  return coalesce(new, old);
end $$;
create trigger aud_patients after insert or update or delete on public.patients
  for each row execute function public.audit_trigger();
create trigger aud_notes    after insert or update or delete on public.session_notes
  for each row execute function public.audit_trigger();
create trigger aud_payments after insert or update or delete on public.payments
  for each row execute function public.audit_trigger();
create trigger aud_invoices after insert or update or delete on public.invoices
  for each row execute function public.audit_trigger();

-- El perfil admin NO se crea solo: alta manual (desactivar signups en Supabase Auth):
--   insert into public.profiles (id, role, full_name) values ('<uuid auth.users>', 'admin', 'TODO');

-- =====================================================================
-- RLS: activada y forzada en TODAS las tablas; por defecto denegar
-- =====================================================================
alter table public.profiles                enable row level security;
alter table public.practice_settings       enable row level security;
alter table public.services                enable row level security;
alter table public.patients                enable row level security;
alter table public.appointment_series      enable row level security;
alter table public.appointments            enable row level security;
alter table public.session_notes           enable row level security;
alter table public.session_note_versions   enable row level security;
alter table public.invoice_counters        enable row level security;
alter table public.invoices                enable row level security;
alter table public.payments                enable row level security;
alter table public.availability_rules      enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.contact_messages        enable row level security;
alter table public.consents                enable row level security;
alter table public.data_requests           enable row level security;
alter table public.audit_log               enable row level security;

alter table public.patients              force row level security;
alter table public.appointments          force row level security;
alter table public.appointment_series    force row level security;
alter table public.session_notes         force row level security;
alter table public.session_note_versions force row level security;
alter table public.payments              force row level security;
alter table public.invoices              force row level security;
alter table public.consents              force row level security;
alter table public.audit_log             force row level security;
alter table public.practice_settings     force row level security;
alter table public.invoice_counters      force row level security;
alter table public.availability_rules    force row level security;
alter table public.availability_exceptions force row level security;
alter table public.contact_messages      force row level security;
alter table public.data_requests         force row level security;
-- (profiles y services quedan sin FORCE: is_admin() lee profiles como propietario; services es lectura publica)

-- Solo admin (rol admin + aal2)
create policy admin_all on public.practice_settings       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.patients                for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.appointment_series      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.appointments            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.session_notes           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.session_note_versions   for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- el contador solo lo modifica issue_invoice (sin huecos): el admin unicamente lo lee
create policy admin_read on public.invoice_counters       for select to authenticated using (public.is_admin());
create policy admin_all on public.invoices                for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.payments                for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.availability_rules      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.availability_exceptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.contact_messages        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.consents                for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.data_requests           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.services                for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- audit_log: admin lee e inserta (lecturas de notas); nadie actualiza ni borra
create policy audit_read   on public.audit_log for select to authenticated using (public.is_admin());
create policy audit_insert on public.audit_log for insert to authenticated with check (public.is_admin());

-- profiles: cada usuario lee el suyo (el middleware lo necesita en aal1); solo admin gestiona
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Unico contenido publico directo: servicios activos (tarifas, reserva)
create policy services_public_read on public.services for select to anon, authenticated using (active);

-- =====================================================================
-- RPCs de reserva: SOLO service_role (Route Handler con Turnstile + rate limit)
-- =====================================================================
-- Rangos ocupados (sin datos personales). La disponibilidad la calcula el servidor (FR-001).
create or replace function public.busy_slots(p_from timestamptz, p_to timestamptz)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.status <> 'cancelled'
    and a.starts_at < p_to and a.ends_at > p_from
    and p_to - p_from <= interval '92 days';
$$;

-- Crea cita 'requested' + consentimientos en una transaccion; el solape lo rechaza el EXCLUDE
create or replace function public.request_appointment(
  p_service uuid, p_starts timestamptz, p_name text, p_email text, p_phone text,
  p_modality text, p_consent_privacy boolean, p_consent_health boolean,
  p_consent_reminders boolean, p_note text, p_guardian jsonb,
  p_token_hash text, p_ip_hash text, p_text_version text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_dur int; v_price int; v_id uuid; v_s public.practice_settings;
begin
  if not (p_consent_privacy and p_consent_health) then raise exception 'consent_required'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(p_email) > 254 then
    raise exception 'invalid_email'; end if;
  if p_name is null or btrim(p_name) = '' then raise exception 'invalid_name'; end if;
  if coalesce(p_modality,'in_person') not in ('in_person','online') then raise exception 'invalid_modality'; end if;
  select * into v_s from public.practice_settings where id;
  if p_starts < now() + make_interval(hours => v_s.min_notice_hours) then raise exception 'too_soon'; end if;
  if p_starts > now() + make_interval(days => v_s.max_advance_days) then raise exception 'too_far'; end if;
  select duration_min, price_cents into v_dur, v_price from public.services where id = p_service and active;
  if v_dur is null then raise exception 'invalid_service'; end if;
  insert into public.appointments(service_id, starts_at, ends_at, status, modality, price_cents,
         requester_name, requester_email, requester_phone, requester_note, requester_guardian, manage_token_hash)
  values (p_service, p_starts, p_starts + make_interval(mins => v_dur), 'requested',
          coalesce(p_modality,'in_person'), v_price, left(p_name,120), p_email, left(p_phone,30),
          left(p_note,500), p_guardian, p_token_hash)
  returning id into v_id;
  insert into public.consents(appointment_id, purpose, text_version, ip_hash)
  values (v_id, 'privacy_policy', p_text_version, p_ip_hash),
         (v_id, 'health_data',    p_text_version, p_ip_hash);
  if p_consent_reminders then
    insert into public.consents(appointment_id, purpose, text_version, ip_hash)
    values (v_id, 'reminders', p_text_version, p_ip_hash);
  end if;
  return v_id;
end $$;

-- =====================================================================
-- Emision de factura atomica: numero correlativo sin huecos (rollback devuelve el numero)
-- =====================================================================
create or replace function public.issue_invoice(
  p_patient uuid, p_concept text, p_subtotal_cents int, p_vat_rate numeric,
  p_payment_ids uuid[] default '{}', p_series text default 'F',
  p_rectifies uuid default null, p_snapshot jsonb default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_year int := extract(year from (now() at time zone 'Europe/Madrid'))::int;
        v_n int; v_vat int; v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_series is null or p_series !~ '^[A-Z]{1,3}$' then raise exception 'invalid_series'; end if;
  if p_subtotal_cents is null or p_subtotal_cents < 0 then raise exception 'invalid_amount'; end if;
  insert into public.invoice_counters(series, year, last_number) values (p_series, v_year, 1)
    on conflict (series, year) do update set last_number = public.invoice_counters.last_number + 1
    returning last_number into v_n;
  v_vat := round(p_subtotal_cents * p_vat_rate / 100.0);
  insert into public.invoices(series, year, seq_no, number, patient_id, rectifies_id, subtotal_cents,
         vat_rate, vat_cents, total_cents, concept, fiscal_snapshot)
  values (p_series, v_year, v_n, p_series || '-' || v_year || '-' || lpad(v_n::text, 4, '0'),
          p_patient, p_rectifies, p_subtotal_cents, p_vat_rate, v_vat, p_subtotal_cents + v_vat,
          p_concept, p_snapshot)
  returning id into v_id;
  update public.payments set invoice_id = v_id
   where id = any(p_payment_ids) and patient_id = p_patient;
  return v_id;
end $$;

-- =====================================================================
-- Vista de ingresos (respeta RLS del invocador); reembolsos restan
-- =====================================================================
create or replace view public.v_income_monthly with (security_invoker = true) as
select date_trunc('month', paid_at at time zone 'Europe/Madrid')::date as month,
       service_id,
       count(*) filter (where status = 'paid')                       as payments_count,
       sum(case status when 'paid' then amount_cents
                       when 'refunded' then -amount_cents end)::bigint as income_cents
from public.payments
where status in ('paid','refunded')
group by 1, 2;

-- =====================================================================
-- Privilegios: anon no toca nada salvo leer servicios; RPCs solo service_role
-- =====================================================================
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select on public.services to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;  -- RLS decide
grant all on all tables in schema public to service_role;
-- invoice_counters: solo lectura (lo escribe issue_invoice, SECURITY DEFINER)
revoke insert, update, delete, truncate on public.invoice_counters from authenticated;
-- audit_log: append-only tambien a nivel de privilegios
revoke update, delete, truncate on public.audit_log from authenticated, service_role;
revoke truncate on all tables in schema public from authenticated, service_role;
-- objetos futuros: nada para anon por defecto
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin()      to authenticated;
grant execute on function public.issue_invoice(uuid,text,int,numeric,uuid[],text,uuid,jsonb) to authenticated;
grant execute on function public.busy_slots(timestamptz,timestamptz)     to service_role;
grant execute on function public.request_appointment(uuid,timestamptz,text,text,text,text,boolean,boolean,boolean,text,jsonb,text,text,text) to service_role;

-- =====================================================================
-- Storage (si existe el esquema storage de Supabase): buckets privados, solo admin
-- =====================================================================
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('invoices','invoices',false), ('consents','consents',false), ('documents','documents',false)
    on conflict (id) do nothing;
    execute $p$ create policy staff_storage on storage.objects for all to authenticated
      using (bucket_id in ('invoices','consents','documents') and public.is_admin())
      with check (bucket_id in ('invoices','consents','documents') and public.is_admin()) $p$;
  end if;
end $$;

-- =====================================================================
-- Semilla minima de servicios (precios TODO_REAL = 0; editar en /admin/ajustes)
-- =====================================================================
insert into public.services (slug, name, duration_min, price_cents, modality, sort_order) values
 ('primera-sesion',    'Primera sesion de valoracion', 60, 0, 'both', 1),
 ('terapia-individual','Terapia individual',           50, 0, 'both', 2),
 ('terapia-pareja',    'Terapia de pareja',            75, 0, 'both', 3)
on conflict (slug) do nothing;
