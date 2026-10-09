# PLAN.md - Caromafla (caromafla.online)

Version final consolidada de docs/plan/01..08 · 2026-10-09 · Metodo: emi:planifica (prd, erd, adr-rfc, spec-kit, openspec, writing-plans, bmad-ux/review).
Etiquetas: `TODO_REAL` = dato real pendiente de la profesional. Este documento manda sobre 01..08 cuando discrepan (seccion 2).

## 1. Resumen ejecutivo

Web nueva para una consulta unipersonal de psicologia (marca provisional "Caromafla"; nombre real, colegiada, NIF, direccion, precios = `TODO_REAL`). Dos partes en un solo proyecto Next.js: (a) web publica animada y accesible (inicio, sobre mi, servicios, tarifas, reserva de cita por solicitud, contacto, blog MDX opcional, legal RGPD) y (b) panel privado `/admin` (dashboard, pacientes con notas clinicas cifradas, calendario dia/semana/mes con recurrencia, ingresos con facturas PDF y graficos, solicitudes, mensajes, ajustes).
Stack: Next.js 15 (App Router, TypeScript estricto, React 19, Tailwind 4) + Supabase UE (Auth+MFA, Postgres con RLS, Storage) + Vercel `fra1`. Datos de salud = categoria especial RGPD (art. 9): RLS forzada en el 100 % de tablas, MFA (aal2) obligatorio, cifrado de aplicacion AES-256-GCM, auditoria append-only, sin cookies no tecnicas, sin datos clinicos en formularios publicos, logs ni emails.
Exito (3 meses): >=15 solicitudes/mes, conversion >=3 %, Lighthouse movil 90/95/95, 0 incidencias, 100 % RLS. Fuera de v1: portal paciente, pagos online (Stripe), multi-profesional, Verifactu, Google Calendar, videollamada propia, CMS de blog.

## 2. Contradicciones detectadas y decision

| # | Tema | Docs en conflicto | Decision final |
|---|---|---|---|
| C1 | Estructura de carpetas | 02 `app/` en raiz; 08 `src/app/(admin)/admin/..` | `src/` con route groups `(public)`, `(auth)`, `(admin)/admin/**` (08). `middleware.ts` en `src/`. |
| C2 | Idioma de tablas/columnas | 02 espanol (`pacientes`); 03/08 ingles; 05 mezcla | Ingles (03 es la fuente del SQL). UI y estados visibles en espanol via diccionario. |
| C3 | Nombre tabla notas | `session_notes` (03) vs `clinical_notes` (05/08) | `session_notes` (+ `session_note_versions`). |
| C4 | Estado de solicitud | `requested` (03) vs `pending` (08/02/05) | BD `requested`; la UI lo muestra como "Pendiente". |
| C5 | Login | `/login` (02), `/admin/login` (05), `(auth)` (08) | `/login` (+ `/login/mfa`), grupo `(auth)`. Sin registro publico. |
| C6 | Rutas legales | `/legal/*` (02) vs `/aviso-legal` raiz (04, 06) | Raiz: `/aviso-legal`, `/privacidad`, `/cookies`, `/consentimiento-informado`, `/privacidad/derechos`. |
| C7 | Env clave de cifrado | `CLINICAL_ENCRYPTION_KEY`, `CLINICAL_NOTES_KEY`, `NOTES_ENC_KEY`, `NOTES_KEY` | Unica: `CLINICAL_ENCRYPTION_KEY` (32 B base64) + `CLINICAL_KEY_VERSION`. |
| C8 | Cifrado: unica clave vs sobre DEK/KEK (06) | 02/03/05 vs 06 | v1: clave maestra en env + clave por paciente derivada con HKDF(patient_id) + AAD = patient_id, `key_version` para rotar. KMS/Vault = v2. |
| C9 | Formato del cifrado | bytea `nonce\|\|ct\|\|tag` (03) vs `{ciphertext,iv}` (08) | bytea (03). API: `encryptNote(plain,{patientId}) -> {bodyEnc:Buffer,keyVersion}`; `decryptNote(bodyEnc,keyVersion,{patientId})`. |
| C10 | Acceso anonimo a la reserva | 03 da `EXECUTE` de `request_appointment`/`busy_slots` a `anon` (salta captcha); 06/04/08 exigen Route Handler | RPCs solo `service_role`; `contact_messages` sin insert anon; anon solo lee `services` activos. La disponibilidad se calcula en servidor (FR-001). |
| C11 | Rol y 2FA | claim `app_metadata.role` (02) vs tabla `profiles` (03) vs `staff`+aal2 en RLS (06) vs MFA "recomendado" (08) | `profiles.role` + `is_admin()` que exige `aal` = `aal2` en el JWT. MFA TOTP obligatorio. Middleware lee su propio perfil (RLS `profiles_self_read`). Sin `owner_id` ni `staff` (consulta unipersonal). |
| C12 | Solape de citas | 05 permite "permitir solape"; 03/05 criterios exigen imposibilidad a nivel BD | Sin override: `EXCLUDE` sobre toda cita no cancelada (incluye completed/no_show). |
| C13 | Horizonte de recurrencia | 12 sem (02) vs 8 sem (03/08) | 12 semanas, configurable en `practice_settings.recurrence_weeks`; materializa un cron diario. |
| C14 | Recordatorios | Vercel Cron (02) vs Edge Function+pg_cron (03) | Vercel Cron diario (`/api/cron/reminders`, `/api/cron/materialize`); sin Edge Functions. |
| C15 | Numeracion de facturas | `invoice_seq` (03; las secuencias dejan huecos) vs "sin huecos" (05/08) | Tabla `invoice_counters` + RPC `issue_invoice` atomica; formato `F-2026-0001`, rectificativas serie `R`. |
| C16 | Reembolsos | `amount>=0` + status (03) vs movimiento negativo (05) | Fila nueva `status='refunded'`, `refund_of` -> original, importe positivo; la vista `v_income_monthly` lo resta. |
| C17 | Alta de paciente desde reserva | 08 P5 crea paciente al reservar; 03/06 minimizan | La reserva crea solo cita `requested` + `consents` (con `appointment_id`). La ficha se crea al aceptar (`upsertPatientFromBooking`). |
| C18 | Blog | MDX (02/08) vs tabla `blog_posts` (03) vs Supabase (04) | MDX en repo (`src/content/blog`), tras flag `NEXT_PUBLIC_BLOG_ENABLED`; tabla `blog_posts` eliminada de v1. |
| C19 | Cookies/banner | banner (08/01) vs "sin cookies no tecnicas" (06/02) | Sin analitica con cookies: no hay banner por defecto. P10 construye `CookieBanner` (AEPD) tras flag `NEXT_PUBLIC_ANALYTICS_ENABLED`, apagado. Fuentes via `next/font` (autoalojadas), mapa OSM, sin Google/Meta. |
| C20 | Tailwind | v4 CSS-first (02) vs `tailwind.config.ts` (08) | Tailwind 4: tokens en `@theme` dentro de `globals.css`; sin `tailwind.config.ts`; `postcss.config.mjs` con `@tailwindcss/postcss`. |
| C21 | Calendario | FullCalendar o propio (02/05) vs propio (08) | Componente propio (rejilla CSS + pointer events/`@dnd-kit/core`); sin FullCalendar. |
| C22 | Migraciones por paquete | un archivo por paquete (08) vs `0001_init.sql` unico (03) | `0001_init.sql` unico y final (P2). Cambios posteriores: `00N0_<pkg>.sql` (P5=0050, P6=0060, P7=0070, P8=0080), solo si son imprescindibles. |
| C23 | Dependencias | cada paquete anade las suyas -> choques en `package.json` | P0 instala TODAS las dependencias (lista en 7.1); nadie edita `package.json`. |
| C24 | Facturas/ingresos rutas | `/admin/facturas` (02) vs bajo ingresos (08) | Bajo ingresos: `/admin/ingresos/facturas`; PDF en `/api/invoices/[id]/pdf`. |
| C25 | Bandeja de solicitudes y mensajes | `/admin/solicitudes` (02) sin dueno en 08; mensajes de contacto sin pantalla | `/admin/solicitudes` -> P7; `/admin/mensajes` -> P9. Ambas en `nav-items.ts`. |
| C26 | Plantillas de email editables (05) | v1 (05) vs fuera de alcance (01) | v2. Plantillas en codigo (React Email) en `src/modules/booking/email/**`. |
| C27 | Tests e2e | `tests/e2e` (02) vs `e2e/**` P10 (08) con P3/P5 escribiendo Playwright | `e2e/` raiz: config y `smoke/` `legal/` = P10; cada paquete `e2e/pN/**`. Unit: `src/**/__tests__` del dueno. |
| C28 | Tipos de BD | `supabase gen types` (08) sin CLI garantizado | P2 escribe/actualiza `src/types/database.ts` a mano coherente con SQL (o lo genera si hay CLI). |
| C29 | Bucket/Storage | `consents`,`invoices`,`documents` (05) vs `invoices`,`blog-covers` (03) | Privados: `invoices`, `consents`, `documents`. Sin `blog-covers`. |
| C30 | Fuentes | `public/fonts` (08) vs `next/font` (07) | `next/font/google` (se autoaloja en build), Fraunces + DM Sans; sin `public/fonts`. |
| C31 | Antelacion/ventana de reserva | 12 h / 60 d (04) | `practice_settings.min_notice_hours=12`, `max_advance_days=60`, editable en Ajustes. |

## 3. Arquitectura

- Una app Next.js 15, TypeScript estricto, route groups: `(public)` (SSG/ISR, animaciones), `(auth)/login`, `(admin)/admin/**` (dinamico, `no-store`, `noindex`).
- Mutaciones: Server Actions + zod (`{ok,data|error}`); API Routes solo para: `api/booking`, `api/contact`, `api/invoices/[id]/pdf`, `api/cron/reminders`, `api/cron/materialize`, `api/health`.
- Defensa en capas (ADR-0005): middleware (sesion + aal2 + perfil admin) -> cada action/layout revalida con `getUser()` (nunca `getSession()`) via `requireAdmin()` -> RLS.
- `service_role` solo en `src/lib/supabase/admin.ts` (`import 'server-only'`): reserva, contacto, derechos RGPD, crons.
- Reserva publica (ADR-0010): `/reservar` -> `POST /api/booking` (zod + honeypot + Turnstile + rate limit Upstash) -> RPC `request_appointment` -> email de confirmacion sin datos clinicos -> admin acepta/rechaza en `/admin/solicitudes`. Cancelar/reprogramar con token firmado (hash en `appointments.manage_token_hash`) hasta 24 h antes.
- Disponibilidad: `getAvailability()` (P7) = `availability_rules` - `availability_exceptions` - `busy_slots` - buffer, en `Europe/Madrid`, con date-fns-tz.
- Recurrencia (ADR-0009): `rrule` en `appointment_series`, citas materializadas a `recurrence_weeks`; "solo esta" marca `is_exception`.
- Email: Resend + React Email; asunto neutro; `.ics` adjunto. PDF: `@react-pdf/renderer` (runtime Node). Graficos: Recharts (paleta dataviz). Fechas: date-fns. Estado de calendario: TanStack Query.
- Entornos: Vercel Preview -> Supabase `caromafla-staging`; produccion -> `caromafla-prod`; ambos UE; datos sinteticos fuera de prod. Migraciones por CI. Crons en `vercel.json`: reminders diario 17:00 UTC, materialize diario 03:00 UTC.
- Observabilidad: Vercel Analytics sin cookies (o Plausible) tras flag, Sentry con `sendDefaultPii:false`; nunca contenido clinico en logs.
- Estructura:
```
src/app/{layout.tsx,globals.css,not-found.tsx,sitemap.ts,robots.ts}
src/app/(public)/{layout,page,sobre-mi,servicios,tarifas,reservar,contacto,blog,aviso-legal,privacidad,cookies,consentimiento-informado,_kit}
src/app/(auth)/login  src/app/(admin)/{layout.tsx, admin/{page,pacientes,calendario,solicitudes,ingresos,mensajes,ajustes}}
src/app/api/{booking,contact,invoices,cron,health}
src/components/{ui,public,admin}  src/modules/{auth,patients,appointments,billing,dashboard,booking}
src/lib/{supabase,crypto,motion,env,rate-limit,turnstile,audit,dates,money,email}  src/config/site.ts  src/content  src/types
supabase/{migrations,tests,seed.sql,config.toml}  e2e/  docs/plan/{handoffs,crypto.md}
```

## 4. Modelo de datos (ver 03; SQL final en `supabase/migrations/0001_init.sql`)

Tablas: `profiles`, `practice_settings` (fila unica: fiscal, politica de reserva, serie de factura), `services`, `patients`, `appointment_series`, `appointments` (EXCLUDE gist, datos de solicitante, `manage_token_hash`, `price_cents`), `session_notes` + `session_note_versions` (bytea cifrado), `invoice_counters`, `invoices` (inmutables tras emitir, `issue_invoice` RPC), `payments` (refund_of), `availability_rules`, `availability_exceptions` (rangos de dias), `contact_messages`, `consents` (versionados, `ip_hash`), `data_requests` (plazo 1 mes), `audit_log` (append-only). Vista `v_income_monthly` (`security_invoker`). Funciones: `is_admin()`, `busy_slots`, `request_appointment` (solo service_role), `issue_invoice`. Storage privado: `invoices`, `consents`, `documents`.
Cambios respecto a 03 (todos listados en seccion 2): aal2 en `is_admin`, RPCs fuera de anon, `FORCE RLS`, `consents`/`data_requests`/`practice_settings`/`session_note_versions`/`invoice_counters` nuevos, `blog_posts` fuera, `availability_exceptions` por rango, `audit_log` inmutable, `revoke all ... from anon`.
Importes en centimos enteros; fechas UTC en BD y `Europe/Madrid` en UI. Retencion: historia clinica >=5 anios (TODO CCAA), facturas 6 anios, solicitudes sin continuidad 12 meses, audit 2 anios.

## 5. Paginas

Publicas (04): `/` (hero, como ayudo, primer paso en 3 pasos, sobre mi resumen, modalidades, FAQ, CTA), `/sobre-mi`, `/servicios` + `/servicios/[slug]`, `/tarifas`, `/reservar` (wizard 4 pasos: servicio, hueco, datos+consentimientos, confirmacion) + `/reservar/confirmacion/[token]` (noindex), `/contacto`, `/blog` + `/blog/[slug]` (flag), legales, `/privacidad/derechos`, 404. Globales: header sticky con CTA, footer con colegiacion y legal, aviso de crisis (112 / 024), boton WhatsApp (TODO_REAL). Contenido de servicios/tarifas: lee `services` de Supabase con respaldo en `src/content/services.ts`; precio 0 se muestra "Consultar".
SEO: Metadata API, JSON-LD `Psychologist`/`MedicalBusiness`/FAQPage/Breadcrumb, sitemap, robots (bloquea `/admin`, `/reservar/confirmacion`), OG. Rendimiento: LCP<2,5 s, CLS<0,1, INP<200 ms, JS inicial <150 KB gz sin GSAP. WCAG 2.2 AA.

## 6. Admin

Rutas: `/admin` (KPIs: citas hoy, ingresos mes con variacion, pacientes activos, pagos pendientes, proxima cita, solicitudes nuevas), `/admin/pacientes` (+`nuevo`, `[id]`, `[id]/notas`), `/admin/calendario` (dia/semana/mes/agenda, drag&drop con rejilla 15 min y deshacer 10 s, recurrentes una/siguientes/serie, bloqueos), `/admin/solicitudes`, `/admin/ingresos` (pagos, pendientes, graficos mes/metodo/servicio, CSV seguro `;` BOM con escape de formulas) + `/admin/ingresos/facturas`, `/admin/mensajes` (contacto + derechos RGPD `data_requests`), `/admin/ajustes` (perfil fiscal, servicios y tarifas, horario, politica de reserva, seguridad/MFA, sesiones, auditoria, exportacion). Notas: editor con bloqueo por inactividad (5 min), versionado, lectura auditada, exportar/anonimizar paciente respetando retencion. Sesion caduca a 30 min de inactividad. Nav fija: `/admin`, `/admin/pacientes`, `/admin/calendario`, `/admin/solicitudes`, `/admin/ingresos`, `/admin/mensajes`, `/admin/ajustes`.

## 7. Seguridad y RGPD (resumen de 06)

Base legal art. 9.2.h + consentimiento explicito para accesorios; EIPD simplificada, RAT y DPAs (Supabase, Vercel, Resend, Upstash, Turnstile) = TODO de la profesional con asesor. Auth: sin signups, contrasena >=12 con HIBP, TOTP + 10 codigos de recuperacion, JWT 1 h, cookies httpOnly/Secure/Lax, rate limit + Turnstile tras 3 fallos. RLS en 100 % de tablas con test de CI. Cabeceras: CSP con nonce, HSTS, `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`; `/admin` noindex. Secretos solo en Vercel; gitleaks en CI. Backups PITR + volcado cifrado semanal. Emails: asunto neutro, sin motivo. Menores: `guardian` y consentimiento del tutor. Puerta de lanzamiento: lista 06 s.15 + textos con marca `REVISAR_CON_ABOGADO`.
7.1 Dependencias que instala P0: next, react, react-dom, typescript, tailwindcss, @tailwindcss/postcss, @supabase/ssr, @supabase/supabase-js, zod, react-hook-form, @hookform/resolvers, date-fns, date-fns-tz, rrule, motion, gsap, lenis, @dnd-kit/core, @tanstack/react-query, recharts, resend, @react-email/components, @react-pdf/renderer, @upstash/ratelimit, @upstash/redis, ics, clsx, tailwind-merge, class-variance-authority, lucide-react, @radix-ui/* (dialog, accordion, tabs, select, toast, tooltip, dropdown-menu), @next/mdx, server-only; dev: vitest, @testing-library/react, jsdom, @playwright/test, @axe-core/playwright, eslint, eslint-config-next, prettier.

## 8. Diseno (resumen de 07)

Calma, calidez, consultorio luminoso; sin gradientes morado-azul, glassmorphism, tarjetas identicas de 3 columnas, emojis-icono ni fotos stock de siluetas. Tokens: bg #FAF6F0, surface #F2EBE1, ink #2B2622, ink-soft #5E544B, primary #5F7A64, accent #C98B6B, sand #E3D3BD, night #1F2A25; admin con semanticos ok #3F7D58 / aviso #B7791F / error #B23A3A. Fraunces (titulares, cursiva en una palabra) + DM Sans (cuerpo/UI, tabular-nums en ingresos). Radios 16-28 px, rejilla 12 col, mobile first. Movimiento: Lenis (solo publica), GSAP+ScrollTrigger (escenas de scroll, import dinamico), Motion (UI React), CSS en hover/focus; escenas: hero con revelado por palabras y trazo SVG, timeline que se dibuja con scroll, palabra a palabra en Sobre mi, lista editorial de servicios con imagen que sigue puntero, acordeones animados, CTA de reserva fija en movil, boton magnetico, circulo que respira (pausable). Sin cursor custom ni loader. `prefers-reduced-motion`: `gsap.matchMedia()` + `MotionConfig reducedMotion="user"`, fundidos <=150 ms. Admin sobrio (100-200 ms, conteo y trazado de graficos una vez). Skills emi:pages a usar listados en 07 s.7 (no 3D/WebGL pesado).

## 9. Paquetes de trabajo

Reglas de colisión: (1) cada paquete solo escribe en sus rutas; (2) cambios ajenos -> `docs/plan/handoffs/<pkg>.md`; (3) `package.json`, `src/types/database.ts`, `src/components/admin/nav-items.ts`, `src/middleware.ts` y `vercel.json` tienen un unico dueno; (4) contratos entre modulos en `src/modules/<x>/api.ts`, con stubs creados por P0 y propiedad transferida al paquete duenio al lanzar la ola 1; (5) tests unitarios dentro de las carpetas propias, e2e en `e2e/pN/**`.

Contratos (firmas fijas):
- `auth/api.ts`: `requireAdmin(): Promise<{userId:string}>`
- `patients/api.ts`: `listPatients(q?)`, `getPatient(id)`, `upsertPatientFromBooking({name,email,phone?,birthDate?,guardian?,appointmentId}): Promise<{id:string}>`
- `appointments/api.ts`: `getAvailability(from:Date,to:Date,serviceId:string): Promise<Slot[]>`, `createAppointment(input)`, `listAppointments({from,to})`, `acceptRequest(id)`, `rejectRequest(id,reason?)`, `markCompleted(id)`
- `billing/api.ts`: `createChargeForAppointment(appointmentId): Promise<{id:string}>`, `getRevenueSeries(range,granularity:'day'|'month')`, `getPendingCharges()`
- `booking/api.ts`: `submitBooking(input)`, `sendBookingEmails(...)` (P5; consume P7/P6)
- `lib/crypto/index.ts` (P2): `encryptNote`, `decryptNote` (C9). `lib/audit.ts` (P0): `logAudit({action,table,rowId,meta?})`.

### Paquete 0 - Scaffold (previo, secuencial)
Posee: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `.env.example`, `vitest.config.ts`, `playwright.config.ts`, `src/app/layout.tsx` (raiz: lang es, next/font Fraunces+DM Sans, metadataBase), `src/app/globals.css` (solo `@import "tailwindcss"` y `@theme` vacio; lo completa P1), `src/lib/{env.ts,rate-limit.ts,turnstile.ts,audit.ts,dates.ts,money.ts}`, `src/lib/supabase/{client,server,admin,middleware}.ts`, `src/lib/email/client.ts`, `src/types/database.ts` (stub), `src/middleware.ts` (stub), stubs `src/modules/*/{api.ts,types.ts}`, carpetas con `.gitkeep`, `docs/plan/handoffs/.gitkeep`.
Hecho cuando: `npm run build`, `npm run lint`, `npm test` pasan en vacio. Instala TODAS las dependencias de 7.1.

### P1 - Sistema de diseno, shell publico y animacion (depende de P0)
Posee: `src/components/ui/**`, `src/components/public/shell/**`, `src/components/motion/**`, `src/lib/motion/**`, `src/config/site.ts`, `src/app/(public)/layout.tsx`, `src/app/(public)/_kit/**`, `src/app/globals.css`, `DESIGN.md`, `EXPERIENCE.md` (raiz).
Entrega: tokens `@theme`, Button/Card/Input/Textarea/Select/Dialog/Toast/Badge/Table/Accordion, Reveal/SplitText/Parallax/Marquee/TimelineScroll/MagneticButton/Breathing, Lenis provider, Header (se oculta al bajar), Footer, BookingCTA fija, `site.ts` con `TODO_REAL`. Test: render y reduced-motion; `/_kit` noindex.

### P2 - BD, RLS, cifrado y tipos (depende de P0)
Posee: `supabase/migrations/0001_init.sql`, `supabase/seed.sql`, `supabase/config.toml`, `supabase/tests/**`, `src/lib/crypto/**`, `src/types/database.ts`, `docs/plan/crypto.md`.
Entrega: validar/ajustar 0001, seed con pacientes ficticios, tests SQL (anon y aal1 no leen nada, solape rechazado, numeracion sin huecos concurrente, audit inmutable, tabla sin RLS falla), crypto AES-256-GCM con HKDF/AAD y rotacion documentada.

### P3 - Auth y shell admin (depende de P0, P2)
Posee: `src/app/(auth)/**`, `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/ajustes/**`, `src/components/admin/shell/**`, `src/components/admin/nav-items.ts`, `src/middleware.ts`, `src/modules/auth/**`, `src/modules/settings/**`, `e2e/p3/**`.
Entrega: login + MFA enrol/verify + codigos de recuperacion, logout, timeout 30 min, middleware (cabeceras `no-store`/`noindex`, CSP con nonce), sidebar/topbar responsive, Cmd+K, Ajustes (perfil fiscal, servicios, horario, bloqueos, politica de reserva, seguridad, auditoria, exportacion), `requireAdmin`.

### P4 - Paginas publicas de contenido (depende de P1)
Posee: `src/app/(public)/page.tsx`, `sobre-mi/**`, `servicios/**`, `tarifas/**`, `contacto/**`, `src/app/api/contact/**`, `src/components/public/sections/**`, `src/content/pages/**`, `src/content/services.ts`, `e2e/p4/**`.
Entrega: inicio con escenas de 8, sobre mi, servicios, tarifas, contacto (honeypot + Turnstile + rate limit), JSON-LD, metadatos, aviso de crisis.

### P5 - Reserva publica (depende de P1; stubs de P6/P7)
Posee: `src/app/(public)/reservar/**`, `src/app/api/booking/**`, `src/app/api/cron/reminders/**`, `src/modules/booking/**`, `src/components/public/booking/**`, `e2e/p5/**`.
Entrega: wizard accesible (calendario con rejilla de teclado + lista de horas), consentimientos separados no premarcados, `.ics`, token de cancelar/reprogramar, emails (confirmacion, aviso a la profesional, recordatorio), cron de recordatorios, test de doble reserva.

### P6 - Pacientes y notas clinicas (depende de P2, P3)
Posee: `src/app/(admin)/admin/pacientes/**`, `src/modules/patients/**`, `src/components/admin/patients/**`, `e2e/p6/**`.
Entrega: lista con busqueda sin acentos, ficha con timeline, menores/tutor, consentimientos (PDF a Storage + URL firmada 60 s), notas cifradas con versiones y bloqueo, exportar JSON+PDF, anonimizar, `data_requests`, auditoria de lecturas.

### P7 - Calendario y solicitudes (depende de P2, P3)
Posee: `src/app/(admin)/admin/calendario/**`, `src/app/(admin)/admin/solicitudes/**`, `src/app/api/cron/materialize/**`, `src/modules/appointments/**`, `src/components/admin/calendar/**`, `e2e/p7/**`.
Entrega: vistas dia/semana/mes/agenda, CRUD de citas, drag&drop/resize + deshacer, recurrencia RRULE (tests DST Europe/Madrid, 8+ semanas), bloqueos, `getAvailability`, bandeja de solicitudes aceptar/rechazar.

### P8 - Ingresos y facturas (depende de P2, P3; contrato appointments)
Posee: `src/app/(admin)/admin/ingresos/**`, `src/app/api/invoices/**`, `src/modules/billing/**`, `src/components/admin/billing/**`, `src/components/admin/charts/**`, `e2e/p8/**`.
Entrega: pagos (parciales, reembolsos), pendientes de cobro, facturas via `issue_invoice` + PDF + rectificativas + envio por email, graficos (mes/metodo/servicio/anual vs anterior, con tabla alternativa), CSV seguro, plantilla fiscal con `TODO_REAL`.

### P9 - Dashboard y mensajes (depende de contratos P6/P7/P8)
Posee: `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/mensajes/**`, `src/modules/dashboard/**`, `src/components/admin/dashboard/**`, `e2e/p9/**`.
Entrega: tarjetas KPI con conteo, proximas citas, alertas, atajos, estados vacio/carga/error, bandeja de mensajes de contacto y de `data_requests` con aviso de vencimiento.

### P10 - Legal, SEO, QA y CI (depende de P1)
Posee: `src/app/(public)/{aviso-legal,privacidad,cookies,consentimiento-informado,blog}/**`, `src/content/{legal,blog}/**`, `src/components/public/{legal,cookie-banner}/**`, `src/app/{sitemap.ts,robots.ts,not-found.tsx}`, `e2e/*.ts`, `e2e/smoke/**`, `e2e/legal/**`, `.github/workflows/**`, `vercel.json`, `.gitleaks.toml`, `docs/plan/anexos/**`.
Entrega: textos legales por capas (art. 13, art. 9.2.h) con `REVISAR_CON_ABOGADO`, `/privacidad/derechos` (insert via service role en action propia), blog MDX tras flag, cookie banner apagado, sitemap/robots/OG, CI (lint, tipos, test, build, gitleaks, comprobacion RLS), cabeceras y crons en `vercel.json`, e2e globales y axe.

### Orden
Ola 0: P0. Ola 1 (paralelo): P1, P2. Ola 2 (paralelo): P3, P4, P5, P6, P7, P8, P9, P10. Ola 3: integracion (quitar stubs, tipos, e2e completo, Lighthouse, revision de diseno con emi:pages). Riesgos de revision: doble reserva, RLS, DST, perdida de clave, huecos de numeracion.

## 10. Abiertos (`TODO_REAL`)
Nombre y colegiada, NIF, direccion/ciudad, precios y servicios reales, fiscalidad (IVA/exencion, Verifactu), edad minima, confirmacion automatica vs manual, testimonios, fotos/logo, proveedor de email, plan Supabase (PITR), retencion autonomica, revision legal de textos y EIPD, modo oscuro admin.
