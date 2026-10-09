# Caromafla.online - Plan de implementación (paquetes paralelos)

> **Para agentes:** usar superpowers:subagent-driven-development. Los pasos usan casillas `- [ ]`. Método: skill `writing-plans` (obra__superpowers) de emi:planifica.

**Objetivo:** web pública animada + panel admin privado (pacientes, calendario, ingresos, dashboard) para una consulta de psicología.
**Arquitectura:** Next.js App Router (TS, Tailwind) con route groups `(public)` y `(admin)`; Supabase (Auth, Postgres con RLS, Storage); Vercel. Cada paquete posee carpetas disjuntas; los puntos de unión compartidos tienen un único dueño (ver "Reglas de colisión").
**Stack:** Next.js, TypeScript, Tailwind, Supabase, Zod, GSAP/Motion, Recharts, Vitest, Playwright.
**Spec:** docs/plan/01..07 (anteriores) y brief del proyecto.

## Restricciones globales
- Marca "Caromafla"; nombre real, teléfono, dirección, NIF, colegiación: `TODO_REAL` en `src/config/site.ts` (dueño P1).
- Datos de salud = categoría especial RGPD: RLS en todas las tablas, notas clínicas cifradas (AES-GCM en servidor, clave en env `NOTES_ENC_KEY`), sin datos de pacientes en logs ni en URLs públicas.
- Español (es-ES), EUR, zona horaria Europe/Madrid, fechas con date-fns.
- Respetar `prefers-reduced-motion`; accesibilidad WCAG AA.
- Ningún agente edita archivos fuera de su lista. Si necesita un cambio ajeno, lo anota en `docs/plan/handoffs/<paquete>.md` (propio) y el dueño lo aplica.

## Prerrequisito P0 - Scaffold (agente previo, ya hecho antes de lanzar P1-P10)
Posee: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`, `.env.example`, `src/app/layout.tsx` (raíz mínima), `src/app/globals.css`, `src/lib/supabase/{client,server,admin}.ts`, `src/types/database.ts` (stub), `src/middleware.ts` (stub que P3 ampliará), carpetas vacías con `.gitkeep` para cada paquete, `vitest.config.ts`, `playwright.config.ts`.
Terminado: `npm run build` y `npm test` pasan en vacío.

## Reglas de colisión
1. Rutas: cada paquete posee sus carpetas exactas bajo `src/app/`; ninguna carpeta se comparte.
2. Migraciones SQL: nombre `supabase/migrations/<AAAAMMDDHHMM>_<paquete>.sql`, un archivo por paquete (prefijo de hora fijo por paquete, ver tabla). Solo P2 crea tablas base; los demás añaden tablas propias que referencian `patients(id)`/`appointments(id)`.
3. Tipos: `src/types/database.ts` lo regenera solo P2 al final (`supabase gen types`); los demás usan tipos propios en `src/modules/<x>/types.ts`.
4. Navegación admin: P3 define `src/components/admin/nav-items.ts` con rutas fijas ya acordadas (`/admin`, `/admin/pacientes`, `/admin/calendario`, `/admin/ingresos`, `/admin/ajustes`); nadie más lo toca.
5. Contratos entre paquetes = funciones en `src/modules/<x>/api.ts` con firmas fijadas abajo; se implementan con stubs desde el minuto 1 para que otros compilen.

## Mapa de dueños

| Pkg | Área | Dueño de (rutas exactas) |
|---|---|---|
| P1 | Sistema de diseño + shell público + animaciones | `src/components/ui/**`, `src/components/public/shell/**`, `src/lib/motion/**`, `src/config/site.ts`, `src/app/(public)/layout.tsx`, `tailwind.config.ts` (tokens), `src/app/globals.css`, `public/fonts/**` |
| P2 | BD, RLS, cifrado, tipos | `supabase/migrations/202601010001_base.sql`, `supabase/seed.sql`, `src/lib/crypto/**`, `src/types/database.ts`, `supabase/tests/**` |
| P3 | Auth y shell admin | `src/app/(auth)/**`, `src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/ajustes/**`, `src/components/admin/shell/**`, `src/components/admin/nav-items.ts`, `src/middleware.ts`, `src/modules/auth/**` |
| P4 | Páginas públicas de contenido | `src/app/(public)/page.tsx`, `sobre-mi/**`, `servicios/**`, `tarifas/**`, `contacto/**`, `src/components/public/sections/**`, `src/content/**` |
| P5 | Reserva pública de cita | `src/app/(public)/reservar/**`, `src/app/api/booking/**`, `src/modules/booking/**`, `src/components/public/booking/**`, migración `202601010005_booking.sql` |
| P6 | Pacientes y notas clínicas | `src/app/(admin)/admin/pacientes/**`, `src/modules/patients/**`, `src/components/admin/patients/**`, migración `202601010006_patients_notes.sql` |
| P7 | Calendario de citas | `src/app/(admin)/admin/calendario/**`, `src/modules/appointments/**`, `src/components/admin/calendar/**`, migración `202601010007_appointments.sql` |
| P8 | Ingresos y facturas | `src/app/(admin)/admin/ingresos/**`, `src/modules/billing/**`, `src/components/admin/billing/**`, migración `202601010008_billing.sql` |
| P9 | Dashboard admin | `src/app/(admin)/admin/page.tsx`, `src/modules/dashboard/**`, `src/components/admin/dashboard/**`, `src/components/admin/charts/**` |
| P10 | Legal RGPD, SEO, blog opcional, QA/E2E, CI | `src/app/(public)/legal/**`, `aviso-legal`, `privacidad`, `cookies`, `blog/**`, `src/components/public/cookie-banner/**`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/not-found.tsx`, `e2e/**`, `.github/workflows/**`, `vercel.json` |

(Los paquetes con migración propia usan los sufijos de la tabla; P2 va primero en orden lexicográfico.)

## Contratos (firmas fijas, stubs desde el inicio)
- `modules/auth/api.ts`: `requireAdmin(): Promise<{userId:string}>` (redirige si no es admin).
- `modules/patients/api.ts`: `listPatients(q?:string): Promise<PatientSummary[]>`, `getPatient(id:string): Promise<Patient|null>`, `upsertPatientFromBooking(input:{name:string;email:string;phone?:string;consent:true}): Promise<{id:string}>`.
- `modules/appointments/api.ts`: `getAvailability(from:Date,to:Date): Promise<Slot[]>`, `createAppointment(input:NewAppointment): Promise<{id:string}>`, `listAppointments(range:{from:Date;to:Date}): Promise<Appointment[]>`, `markCompleted(id:string): Promise<void>`.
- `modules/billing/api.ts`: `createChargeForAppointment(appointmentId:string): Promise<{id:string}>`, `getRevenueSeries(range, granularity:'day'|'month'): Promise<{period:string;total:number}[]>`.
- `modules/dashboard/api.ts` solo consume los anteriores (lectura).
Nota: P5 consume `getAvailability`/`createAppointment`/`upsertPatientFromBooking` (de P7 y P6); hasta que existan, usa los stubs.

## Paquetes (detalle)

### P1 - Sistema de diseño y animación
- Depende de: P0.
- Entrega: tokens (paleta calmada, tipografías), `Button, Card, Input, Textarea, Select, Dialog, Toast, Badge, Table`, `Reveal, Parallax, SplitText, Marquee` (GSAP ScrollTrigger + Motion), `Header/Footer` públicos, `site.ts`.
- Test: Vitest render de cada componente; test de que con `prefers-reduced-motion` las animaciones se desactivan.
- Terminado: página `/_kit` (dentro de `src/app/(public)/_kit/` propiedad de P1) muestra todo; build y a11y sin errores.

### P2 - Base de datos y seguridad
- Depende de: P0.
- Tablas: `profiles(role)`, `patients`, `clinical_notes(ciphertext,iv)`, `appointments`, `availability_rules`, `payments`, `invoices`, `consents`, `audit_log`. RLS: solo `role='admin'` lee/escribe; inserciones públicas solo vía service role en `api/booking`.
- `lib/crypto`: `encryptNote(plain:string):Promise<{ciphertext:string;iv:string}>`, `decryptNote(...)`.
- Test: `supabase/tests/rls.test.sql` (anon no lee nada) y Vitest de cifrado (round trip, IV distinto, manipulación falla).
- Terminado: migraciones aplican en limpio, seed con pacientes ficticios, tipos generados. P6-P8 esperan solo el esquema base, que se publica primero (primer commit del paquete).

### P3 - Autenticación y shell admin
- Depende de: P0, P2 (tabla `profiles`).
- Entrega: login (email+contraseña, MFA TOTP recomendado), logout, middleware que protege `/admin/**`, layout con sidebar/topbar responsive, página Ajustes (perfil, horario base -> `availability_rules`).
- Test: Playwright de acceso: anónimo redirige a `/login`; admin entra.
- Terminado: `requireAdmin` implementado.

### P4 - Páginas públicas de contenido
- Depende de: P1.
- Entrega: Inicio (hero animado), Sobre mí, Servicios/terapias (individual, pareja, online), Tarifas, Contacto (formulario -> `api/contact` propio: `src/app/api/contact/**`), contenido en `src/content/*.ts` con `TODO_REAL`.
- Test: render + metadatos por página.
- Terminado: Lighthouse a11y/SEO >= 95 en móvil.

### P5 - Reserva pública
- Depende de: P1; contratos de P6/P7 (stubs).
- Entrega: asistente 3 pasos (servicio, hueco, datos+consentimiento RGPD explícito), Zod, antirrobot (honeypot + rate limit), email de confirmación (`src/modules/booking/email.ts`), `api/booking`.
- Test: Vitest de validación y de doble reserva (mismo hueco rechazado); Playwright flujo feliz.
- Terminado: reserva crea cita `pending` + paciente + consentimiento registrado.

### P6 - Pacientes y notas clínicas
- Depende de: P2, P3.
- Entrega: lista con búsqueda, ficha (datos, historial de citas, pagos, consentimientos), notas clínicas cifradas con edición/versiones, exportar/borrar datos (derechos RGPD), `audit_log` de cada lectura de notas.
- Test: notas se guardan cifradas (columna no contiene texto plano); sin sesión no se accede.
- Terminado: CRUD completo y auditado.

### P7 - Calendario
- Depende de: P2, P3.
- Entrega: vistas día/semana/mes (componente propio, sin dependencias que choquen), crear/mover/cancelar cita, recurrentes (regla RRULE simple semanal/quincenal), cálculo de `getAvailability`, evitar solapes.
- Test: solapes, recurrencia 8 semanas, cambio horario verano/invierno (Europe/Madrid).
- Terminado: contrato de `appointments/api.ts` completo.

### P8 - Ingresos y facturas
- Depende de: P2, P3, contrato `appointments`.
- Entrega: registro de pagos (efectivo/transferencia/Bizum/tarjeta), estado, factura numerada correlativa (`serie/año/nº`, sin huecos), PDF (`@react-pdf/renderer`), gráficos mensuales (Recharts), export CSV.
- Test: numeración sin huecos con concurrencia; totales por periodo.
- Terminado: `getRevenueSeries` y `createChargeForAppointment` implementados. Plantilla de factura con `TODO_REAL` fiscal.

### P9 - Dashboard
- Depende de: contratos de P6/P7/P8 (stubs).
- Entrega: tarjetas (citas hoy, próximas, ingresos mes, pacientes activos, pagos pendientes), gráfico ingresos, lista agenda del día.
- Test: render con datos mock; estados vacío/carga/error.
- Terminado: conectado a datos reales tras fusionar P6-P8.

### P10 - Legal, SEO, QA y CI
- Depende de: P1.
- Entrega: Aviso legal, Privacidad (responsable, finalidad, base legal art. 9.2.h RGPD, conservación), Cookies + banner con consentimiento, sitemap/robots/OG, blog opcional MDX (`src/content/blog/**`), 404, e2e globales, CI (lint, typecheck, test, build), `vercel.json` (cabeceras de seguridad, CSP).
- Test: e2e de banner de cookies; CI verde.
- Terminado: pipeline pasa; textos legales marcados `REVISAR_CON_ABOGADO`.

## Orden de ejecución
- Ola 0: P0.
- Ola 1 (en paralelo): P1, P2, y el esqueleto con stubs de contratos.
- Ola 2 (en paralelo): P3, P4, P5, P10 (tras P1); P6, P7, P8, P9 (tras esquema de P2 y stubs).
- Ola 3: integración (quitar stubs, regenerar tipos P2, e2e completo P10).

## Review Focus (riesgos sin cubrir por tareas)
1. Doble reserva simultánea del mismo hueco: constraint de exclusión en BD (test en P7/P5).
2. Fuga de datos de pacientes por RLS mal configurada: test anon en P2.
3. Cambio de hora (DST) rompe citas recurrentes: test en P7.
4. Clave de cifrado perdida/rotada: documentar rotación en P2 (`docs/plan/crypto.md` propiedad de P2).
5. Hueco en numeración de facturas por error/rollback: test en P8.

## Auto-revisión
- Cobertura: web pública, reserva, admin (pacientes, calendario, ingresos, dashboard), RGPD cubiertos. Blog opcional en P10.
- Sin solape de archivos: verificado por tabla de dueños; puntos compartidos (nav, tipos, layout, migraciones) con dueño único.
