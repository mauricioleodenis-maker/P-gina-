# 03 - Modelo de datos y ERD (Caromafla)

Metodo: skill `erd` (lazzyms__prd-erd-skills). Aqui ERD = Engineering Requirements Document; se cubren sus secciones 3, 4 y 5 (requisitos no funcionales de datos, estimacion, esquemas y patrones de lectura/escritura). Supuesto: no hay PRD aprobado en el repo, la seccion de producto se toma del encargo y queda **sin verificar**.

Stack: Supabase (Postgres 15+, Auth, RLS, Storage) + Next.js en Vercel. Datos de salud = categoria especial RGPD (art. 9).

## 1. Contexto y decisiones

- Decidi **un unico rol operativo (`admin`)** porque es una consulta de una psicologa; `profiles.role` permite ampliar a `assistant` sin tocar el esquema. Solo `admin` accede a datos clinicos.
- Decidi **RLS por defecto denegar + funcion `is_admin()` SECURITY DEFINER** porque evita recursion de politicas sobre `profiles` y centraliza la regla.
- Decidi **cifrar las notas de sesion en la aplicacion (AES-256-GCM, columna `bytea`)** con clave en variable de entorno de Vercel (no en BD) porque asi un volcado de la BD o un acceso de Supabase no expone texto clinico. RLS es la 2a barrera. Alternativa: Supabase Vault/pgsodium (TODO decidir).
- Decidi **recurrencia materializada**: `appointment_series` (regla) + filas en `appointments` generadas hasta N semanas, porque calendario, ingresos y recordatorios consultan citas reales y permiten editar/cancelar una sola ocurrencia.
- Decidi **exclusion constraint (btree_gist)** sobre el rango de la cita para impedir solapes a nivel BD, no solo en UI.
- Decidi **importes en centimos (integer) + moneda** para evitar errores de coma flotante.
- Decidi **la web publica nunca lee `patients`/`appointments`**; la reserva usa RPC `security definer` que devuelve solo huecos ocupados (rangos sin datos personales) y crea solicitudes.
- Decidi **borrado logico (`deleted_at`) en pacientes** y retencion legal: historia clinica 5 anios minimo (Ley 41/2002, ver legal con asesor, TODO); facturas 6 anios (Codigo de Comercio) / 4 (tributario).
- Datos reales (nombre, NIF, n. colegiada, IBAN, serie de factura, IVA/exencion sanitaria) = **TODO**.

## 2. Requisitos no funcionales de datos

| Aspecto | Requisito |
|---|---|
| Consistencia | Fuerte (Postgres, una region UE, p.ej. eu-west/Frankfurt) |
| Cifrado | TLS en transito; disco cifrado (Supabase); notas clinicas cifradas en columna |
| Acceso | Solo `admin` autenticado con MFA (TOTP) obligatorio |
| Auditoria | `audit_log` de accesos/cambios sobre pacientes, notas, pagos |
| Backups | PITR de Supabase (plan Pro) + export semanal cifrado (TODO) |
| Carga | 1 usuaria admin, ~25-40 citas/semana, <500 pacientes/anio; trivial |
| Latencia | Listados <200 ms con los indices definidos |

## 3. Estimacion (back-of-the-envelope)

- Pacientes: 300 activos, 1.000 acumulados. Citas: 35/sem = ~1.800/anio. Notas: 1/cita (~2 KB cifrado) = ~4 MB/anio.
- Pagos/facturas: ~1.800/anio. PDFs de factura en Storage ~60 KB = ~110 MB/anio.
- Contactos web: <50/mes. Blog: <100 posts.
- Total BD <100 MB en 5 anios; cabe en el plan gratuito/Pro sin particionar. Lectura:escritura ~10:1. Todo sincrono (sin colas); recordatorios por email via Supabase Edge Function + pg_cron (async).

## 4. Diagrama ERD

```mermaid
erDiagram
  auth_users ||--|| profiles : "1:1"
  patients ||--o{ appointments : tiene
  services ||--o{ appointments : tipo
  appointment_series ||--o{ appointments : genera
  patients ||--o{ appointment_series : "recurrencia"
  appointments ||--o| session_notes : "nota"
  patients ||--o{ session_notes : historia
  appointments ||--o{ payments : "se paga"
  patients ||--o{ payments : paga
  payments }o--o| invoices : "factura"
  patients ||--o{ invoices : recibe
  profiles ||--o{ blog_posts : autor
  profiles ||--o{ audit_log : actor
  availability_rules }o--|| profiles : "de"
  availability_exceptions }o--|| profiles : "de"
  contact_messages }o--o| patients : "posible"

  profiles { uuid id PK; text role; text full_name }
  patients { uuid id PK; text full_name; text email; text phone; date birth_date; bool consent_data; timestamptz deleted_at }
  services { uuid id PK; text slug; int duration_min; int price_cents; bool active }
  appointment_series { uuid id PK; uuid patient_id FK; text rrule; timestamptz dtstart; date until }
  appointments { uuid id PK; uuid patient_id FK; uuid service_id FK; uuid series_id FK; tstzrange period; text status }
  session_notes { uuid id PK; uuid appointment_id FK; bytea body_enc }
  payments { uuid id PK; uuid appointment_id FK; int amount_cents; text method; text status }
  invoices { uuid id PK; text number; uuid patient_id FK; int total_cents; text pdf_path }
  availability_rules { uuid id PK; int weekday; time start_time; time end_time }
  availability_exceptions { uuid id PK; date day; bool is_closed }
  blog_posts { uuid id PK; text slug; text status; timestamptz published_at }
  contact_messages { uuid id PK; text email; text message; bool handled }
  audit_log { bigint id PK; uuid actor; text table_name; text action }
```

## 5. Lectura/escritura por tabla

| Tabla | Lectura tipica | Escritura | Indices clave |
|---|---|---|---|
| patients | buscar por nombre/email, ficha | alta/edicion admin | trigram en `full_name`, `email` |
| appointments | rango de fechas (calendario), por paciente | admin + RPC publica (estado `requested`) | GiST `period`, `(patient_id, starts_at)`, `(status, starts_at)` |
| session_notes | por paciente (historial) | admin | `(patient_id, created_at desc)` |
| payments | por mes (graficos), por paciente | admin | `(paid_at)`, `(patient_id)`, `(status)` |
| invoices | por numero, por anio | admin | unique `number`, `(issued_on)` |
| availability_* | web publica (huecos) | admin | `(weekday)`, unique `(day)` |
| blog_posts | publico por slug | admin | unique `slug`, `(status, published_at desc)` |
| contact_messages | admin bandeja | insert publico (rate limit en servidor) | `(handled, created_at desc)` |

Ingresos (graficos): vista `v_income_monthly` agrega `payments` pagados por mes y servicio (solo admin via RLS en tablas base, `security_invoker`).

## 6. SQL de migracion completo

Archivo propuesto: `supabase/migrations/0001_init.sql`.

```sql
-- =========================================================
-- 0001_init.sql  -  Caromafla (consulta de psicologia)
-- =========================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;   -- exclusion constraint
create extension if not exists pg_trgm;      -- busqueda por nombre
create extension if not exists citext;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

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

-- is_admin(): SECURITY DEFINER evita recursion de RLS sobre profiles.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- services ----------
create table public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  description   text,
  duration_min  int  not null check (duration_min between 15 and 240),
  price_cents   int  not null check (price_cents >= 0),
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
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  email            citext,
  phone            text,
  birth_date       date,
  national_id      text,                       -- DNI/NIE (necesario para facturar)
  address          text,
  emergency_contact text,
  status           text not null default 'active' check (status in ('active','paused','discharged')),
  consent_data     boolean not null default false,   -- consentimiento tratamiento datos de salud
  consent_data_at  timestamptz,
  consent_marketing boolean not null default false,
  internal_notes   text,                        -- NO clinico (administrativo)
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index patients_name_trgm on public.patients using gin (full_name gin_trgm_ops);
create index patients_email_idx on public.patients (email);
create index patients_active_idx on public.patients (status) where deleted_at is null;
create trigger trg_patients_upd before update on public.patients
  for each row execute function public.set_updated_at();

-- ---------- appointment_series (recurrencia) ----------
create table public.appointment_series (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete restrict,
  service_id  uuid not null references public.services(id),
  rrule       text not null,                   -- RFC 5545, p.ej. FREQ=WEEKLY;INTERVAL=1;BYDAY=TU
  dtstart     timestamptz not null,
  duration_min int not null check (duration_min > 0),
  until       date,                            -- fin de la serie (o null + count en rrule)
  tz          text not null default 'Europe/Madrid',
  modality    text not null default 'in_person' check (modality in ('in_person','online')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index series_patient_idx on public.appointment_series (patient_id);
create trigger trg_series_upd before update on public.appointment_series
  for each row execute function public.set_updated_at();

-- ---------- appointments ----------
create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references public.patients(id) on delete restrict, -- null si 'requested' sin ficha aun
  service_id  uuid not null references public.services(id),
  series_id   uuid references public.appointment_series(id) on delete set null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  period      tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  status      text not null default 'scheduled'
              check (status in ('requested','scheduled','confirmed','completed','cancelled','no_show')),
  modality    text not null default 'in_person' check (modality in ('in_person','online')),
  meeting_url text,
  is_exception boolean not null default false,  -- ocurrencia editada de una serie
  -- datos de solicitud publica (cuando patient_id es null)
  requester_name  text,
  requester_email citext,
  requester_phone text,
  cancel_reason   text,
  reminder_sent_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at > starts_at),
  check (patient_id is not null or requester_email is not null),
  -- sin solapes entre citas activas
  constraint appointments_no_overlap exclude using gist (period with &&)
    where (status in ('requested','scheduled','confirmed'))
);
create index appt_period_gist on public.appointments using gist (period);
create index appt_patient_idx on public.appointments (patient_id, starts_at desc);
create index appt_status_idx  on public.appointments (status, starts_at);
create index appt_series_idx  on public.appointments (series_id) where series_id is not null;
create trigger trg_appt_upd before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------- session_notes (CLINICO, cifrado en aplicacion) ----------
create table public.session_notes (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid unique references public.appointments(id) on delete set null,
  body_enc       bytea not null,        -- AES-256-GCM: nonce(12) || ciphertext || tag(16)
  key_version    smallint not null default 1,   -- rotacion de claves
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index notes_patient_idx on public.session_notes (patient_id, created_at desc);
create trigger trg_notes_upd before update on public.session_notes
  for each row execute function public.set_updated_at();

-- ---------- invoices ----------
create sequence public.invoice_seq;
create table public.invoices (
  id           uuid primary key default gen_random_uuid(),
  number       text not null unique,                 -- p.ej. 2026-0001 (serie = TODO)
  patient_id   uuid not null references public.patients(id) on delete restrict,
  issued_on    date not null default current_date,
  subtotal_cents int not null check (subtotal_cents >= 0),
  vat_rate     numeric(4,2) not null default 0,      -- servicios sanitarios suelen estar exentos (TODO confirmar)
  vat_cents    int not null default 0,
  total_cents  int not null check (total_cents >= 0),
  currency     char(3) not null default 'EUR',
  status       text not null default 'issued' check (status in ('draft','issued','void')),
  concept      text not null,
  pdf_path     text,                                 -- Storage bucket 'invoices' (privado)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index invoices_patient_idx on public.invoices (patient_id);
create index invoices_issued_idx  on public.invoices (issued_on desc);
create trigger trg_invoices_upd before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------- payments ----------
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete restrict,
  appointment_id uuid references public.appointments(id) on delete set null,
  invoice_id     uuid references public.invoices(id) on delete set null,
  service_id     uuid references public.services(id),
  amount_cents   int not null check (amount_cents >= 0),
  currency       char(3) not null default 'EUR',
  method         text not null default 'cash' check (method in ('cash','card','transfer','bizum','stripe','other')),
  status         text not null default 'pending' check (status in ('pending','paid','refunded','failed')),
  paid_at        timestamptz,
  external_ref   text,                                -- id Stripe u otro (opcional)
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (status <> 'paid' or paid_at is not null)
);
create index pay_paid_idx    on public.payments (paid_at) where status = 'paid';
create index pay_patient_idx on public.payments (patient_id);
create index pay_status_idx  on public.payments (status);
create index pay_invoice_idx on public.payments (invoice_id);
create trigger trg_pay_upd before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- availability ----------
create table public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  weekday     smallint not null check (weekday between 0 and 6),  -- 0=domingo
  start_time  time not null,
  end_time    time not null,
  modality    text not null default 'both' check (modality in ('in_person','online','both')),
  active      boolean not null default true,
  check (end_time > start_time)
);
create index avail_rules_wd_idx on public.availability_rules (weekday) where active;

create table public.availability_exceptions (   -- vacaciones, festivos, dias extra
  id          uuid primary key default gen_random_uuid(),
  day         date not null,
  is_closed   boolean not null default true,
  start_time  time,
  end_time    time,
  reason      text,
  unique (day, start_time),
  check (is_closed or (start_time is not null and end_time > start_time))
);

-- ---------- blog_posts ----------
create table public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body_md       text not null,
  cover_path    text,
  status        text not null default 'draft' check (status in ('draft','published')),
  published_at  timestamptz,
  author_id     uuid references public.profiles(id),
  seo_title     text,
  seo_description text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index blog_pub_idx on public.blog_posts (published_at desc) where status = 'published';
create trigger trg_blog_upd before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------- contact_messages ----------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       citext not null check (char_length(email) <= 254),
  phone       text check (char_length(phone) <= 30),
  message     text not null check (char_length(message) between 1 and 4000),
  consent     boolean not null check (consent),      -- aceptacion politica privacidad
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index contact_inbox_idx on public.contact_messages (handled, created_at desc);

-- ---------- audit_log ----------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid,
  table_name  text not null,
  row_id      uuid,
  action      text not null,                 -- insert|update|delete|read_notes
  at          timestamptz not null default now(),
  diff        jsonb                          -- NUNCA incluir body_enc ni texto clinico
);
create index audit_at_idx on public.audit_log (at desc);

create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(actor, table_name, row_id, action)
  values (auth.uid(), tg_table_name,
          coalesce((case when tg_op='DELETE' then old.id else new.id end), null),
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

-- ---------- profile auto-creado: NO se crea solo; el admin se da de alta a mano ----------
-- (evita que cualquiera que se registre obtenga rol). Desactivar signups en Supabase Auth.

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles                enable row level security;
alter table public.patients                enable row level security;
alter table public.appointment_series     enable row level security;
alter table public.appointments            enable row level security;
alter table public.session_notes           enable row level security;
alter table public.payments                enable row level security;
alter table public.invoices                enable row level security;
alter table public.services                enable row level security;
alter table public.availability_rules      enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.blog_posts              enable row level security;
alter table public.contact_messages        enable row level security;
alter table public.audit_log               enable row level security;

-- Solo admin: datos clinicos y de negocio
create policy admin_all on public.patients            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.appointment_series for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.appointments        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.session_notes       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.payments            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.invoices            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.availability_exceptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_read_audit on public.audit_log    for select to authenticated using (public.is_admin());

-- profiles: cada usuario ve el suyo; solo admin gestiona
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Contenido publico (anon + authenticated leen; solo admin escribe)
create policy services_public_read on public.services for select to anon, authenticated using (active);
create policy services_admin_write on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy avail_public_read on public.availability_rules for select to anon, authenticated using (active);
create policy avail_admin_write on public.availability_rules for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy avail_exc_public_read on public.availability_exceptions for select to anon using (true);
-- (la politica admin_all de arriba cubre al admin; anon solo lee dias/horas, sin motivo sensible: reason es opcional, TODO no exponer)

create policy blog_public_read on public.blog_posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());
create policy blog_admin_write on public.blog_posts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contacto: anon puede insertar (validado por CHECKs), nunca leer
create policy contact_insert_public on public.contact_messages for insert to anon, authenticated with check (consent);
create policy contact_admin_read on public.contact_messages for select to authenticated using (public.is_admin());
create policy contact_admin_upd  on public.contact_messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy contact_admin_del  on public.contact_messages for delete to authenticated using (public.is_admin());

-- Defensa en profundidad: quitar privilegios a anon sobre tablas sensibles
revoke all on public.patients, public.appointments, public.appointment_series,
              public.session_notes, public.payments, public.invoices, public.audit_log
  from anon;

-- =========================================================
-- RPCs publicas para la reserva (sin exponer datos personales)
-- =========================================================
-- Rangos ocupados (solo inicio/fin) para calcular huecos en la web
create or replace function public.busy_slots(p_from timestamptz, p_to timestamptz)
returns table(starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at
  from public.appointments a
  where a.status in ('requested','scheduled','confirmed')
    and a.starts_at < p_to and a.ends_at > p_from
    and p_to - p_from <= interval '62 days';
$$;
grant execute on function public.busy_slots(timestamptz, timestamptz) to anon, authenticated;

-- Solicitud de cita publica: crea cita 'requested'; el solape lo rechaza el EXCLUDE
create or replace function public.request_appointment(
  p_service uuid, p_starts timestamptz, p_name text, p_email text, p_phone text,
  p_modality text, p_consent boolean)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_dur int; v_id uuid;
begin
  if not p_consent then raise exception 'consent_required'; end if;
  if p_starts < now() + interval '12 hours' then raise exception 'too_soon'; end if;
  select duration_min into v_dur from public.services where id = p_service and active;
  if v_dur is null then raise exception 'invalid_service'; end if;
  insert into public.appointments(service_id, starts_at, ends_at, status, modality,
                                  requester_name, requester_email, requester_phone)
  values (p_service, p_starts, p_starts + make_interval(mins => v_dur), 'requested',
          coalesce(p_modality,'in_person'), left(p_name,120), p_email, left(p_phone,30))
  returning id into v_id;
  return v_id;
end $$;
grant execute on function public.request_appointment(uuid,timestamptz,text,text,text,text,boolean) to anon, authenticated;
-- Nota: la web debe llamarla desde un Route Handler con rate limit + captcha (Turnstile).

-- =========================================================
-- Vistas de ingresos (respetan RLS del invocador)
-- =========================================================
create or replace view public.v_income_monthly with (security_invoker = true) as
select date_trunc('month', paid_at)::date as month,
       service_id,
       count(*)                as payments_count,
       sum(amount_cents)       as income_cents
from public.payments
where status = 'paid'
group by 1, 2;

-- =========================================================
-- Storage (ejecutar tras crear buckets privados 'invoices' y 'blog-covers')
-- =========================================================
-- bucket 'invoices': privado, solo admin
-- create policy invoices_admin on storage.objects for all to authenticated
--   using (bucket_id = 'invoices' and public.is_admin())
--   with check (bucket_id = 'invoices' and public.is_admin());
-- bucket 'blog-covers': publico lectura, escritura admin
-- create policy covers_read on storage.objects for select using (bucket_id = 'blog-covers');
-- create policy covers_admin on storage.objects for all to authenticated
--   using (bucket_id = 'blog-covers' and public.is_admin())
--   with check (bucket_id = 'blog-covers' and public.is_admin());

-- =========================================================
-- Semilla minima (editar con datos reales - TODO)
-- =========================================================
insert into public.services (slug, name, duration_min, price_cents, modality, sort_order) values
 ('primera-sesion',   'Primera sesion de valoracion', 60, 0, 'both', 1),   -- TODO precio
 ('terapia-individual','Terapia individual',          50, 0, 'both', 2),   -- TODO precio
 ('terapia-pareja',   'Terapia de pareja',            75, 0, 'both', 3)    -- TODO precio
on conflict (slug) do nothing;
```

## 7. Notas de implementacion

- **Alta del admin**: crear usuario en Supabase Auth, desactivar registro publico, `insert into profiles (id, role) values ('<uuid>', 'admin')`; activar MFA TOTP y comprobar `aal2` en middleware de Next.
- **Clave de cifrado**: `CLINICAL_NOTES_KEY` (32 bytes base64) en Vercel; `key_version` permite rotacion re-cifrando en lote. Sin la clave las notas son irrecuperables: guardar copia offline (TODO).
- **Service role key**: solo en servidor (Route Handlers/Server Actions); nunca en cliente. Los envios de recordatorios usan Edge Function.
- **Generacion de recurrencias**: job (pg_cron o Vercel Cron) que materializa citas de las series activas 8 semanas por delante, usando la libreria `rrule`; el EXCLUDE evita solapes y el job registra conflictos para revision.
- **Exportar/borrar (RGPD)**: funcion de exportacion por paciente (derecho de acceso/portabilidad); supresion = anonimizar, respetando plazos de retencion.
- **Riesgos abiertos**: IVA/exencion de factura, retencion exacta, DPA con Supabase/Vercel, region UE confirmada, registro de actividades de tratamiento y EIPD (datos de salud) = TODO legal.
- **Tests**: pruebas pgTAP/SQL de RLS (anon no lee `patients`/`session_notes`; usuario no admin tampoco; solape rechazado; contacto sin consentimiento rechazado).
