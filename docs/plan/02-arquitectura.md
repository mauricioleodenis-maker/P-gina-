# 02 - Arquitectura técnica: Caromafla (caromafla.online)

Estado: propuesto. Método: skill `adr-rfc` (MADR 4.0) de emi:planifica. Los datos reales de la profesional (nombre, nº colegiada, NIF, dirección) están marcados `TODO`.

## 1. Resumen de stack

- Next.js 15 (App Router, TypeScript estricto, Tailwind CSS 4), React 19.
- Supabase: Auth, Postgres con RLS, Storage. Región UE (Frankfurt) por RGPD.
- Vercel (región `fra1`/`cdg1`) para el despliegue.
- Librerías: `@supabase/ssr`, `zod`, `react-hook-form`, `motion` (animaciones), `gsap` (opcional, scroll), `date-fns`, `@fullcalendar/*` o calendario propio, `recharts` (gráficos), `resend` (email), `@react-pdf/renderer` (facturas).
- Datos clínicos: cifrado a nivel de aplicación (AES-256-GCM) además del cifrado en reposo de Supabase.

## 2. Estructura de carpetas

```
/
├─ app/
│  ├─ (public)/                 # web pública (layout con header/footer, animaciones)
│  │  ├─ page.tsx               # inicio
│  │  ├─ sobre-mi/page.tsx
│  │  ├─ servicios/page.tsx
│  │  ├─ servicios/[slug]/page.tsx
│  │  ├─ tarifas/page.tsx
│  │  ├─ reservar/page.tsx      # reserva de cita (formulario + huecos libres)
│  │  ├─ contacto/page.tsx
│  │  ├─ blog/page.tsx, blog/[slug]/page.tsx   # opcional
│  │  └─ legal/{aviso-legal,privacidad,cookies,consentimiento}/page.tsx
│  ├─ (auth)/login/page.tsx     # login de la profesional (sin registro público)
│  ├─ admin/
│  │  ├─ layout.tsx             # shell: sidebar, comprobación de sesión
│  │  ├─ page.tsx               # dashboard
│  │  ├─ pacientes/page.tsx, [id]/page.tsx, nuevo/page.tsx
│  │  ├─ pacientes/[id]/notas/  # notas clínicas (cifradas)
│  │  ├─ calendario/page.tsx    # vistas día/semana/mes, recurrentes
│  │  ├─ citas/[id]/page.tsx
│  │  ├─ ingresos/page.tsx      # pagos, gráficos
│  │  ├─ facturas/page.tsx, [id]/page.tsx
│  │  ├─ solicitudes/page.tsx   # reservas web pendientes de confirmar
│  │  └─ ajustes/page.tsx       # disponibilidad, tarifas, perfil
│  ├─ api/
│  │  ├─ cron/recordatorios/route.ts   # Vercel Cron (emails recordatorio)
│  │  ├─ facturas/[id]/pdf/route.ts
│  │  └─ health/route.ts
│  ├─ layout.tsx, globals.css, not-found.tsx, sitemap.ts, robots.ts
├─ components/
│  ├─ ui/                       # primitivas (button, input, dialog...)
│  ├─ public/                   # hero, secciones, formularios públicos
│  ├─ admin/                    # tablas, calendario, tarjetas KPI, gráficos
│  └─ motion/                   # wrappers de animación (Reveal, Parallax, Stagger)
├─ lib/
│  ├─ supabase/{server.ts,client.ts,middleware.ts,admin.ts}
│  ├─ actions/                  # server actions por dominio (ver §5)
│  ├─ crypto/clinical.ts        # cifrado/descifrado AES-256-GCM
│  ├─ validation/               # esquemas zod compartidos
│  ├─ availability.ts           # cálculo de huecos
│  ├─ recurrence.ts             # expansión de citas recurrentes (RRULE)
│  ├─ billing.ts                # numeración de facturas, IVA/exención
│  ├─ email/ (resend + plantillas)
│  ├─ rate-limit.ts, audit.ts, env.ts
├─ supabase/
│  ├─ migrations/*.sql          # esquema + RLS versionados
│  ├─ seed.sql
│  └─ config.toml
├─ middleware.ts
├─ docs/{plan,decisions}/
├─ tests/{unit,e2e}/            # vitest + playwright
├─ .env.example
└─ vercel.json                  # crons, regiones, cabeceras
```

## 3. Rutas

| Ruta | Acceso | Notas |
|---|---|---|
| `/`, `/sobre-mi`, `/servicios`, `/tarifas`, `/contacto`, `/blog`, `/legal/*` | Público | SSG/ISR; contenido editable en código o tabla `contenido` |
| `/reservar` | Público | Server action con captcha + rate limit; crea `solicitud_cita` en estado `pendiente` |
| `/login` | Público | Solo email+contraseña y MFA TOTP; sin registro |
| `/admin/**` | Solo rol `admin` | Dinámico, `noindex`, sin caché |
| `/api/cron/*` | Cabecera `Authorization: Bearer CRON_SECRET` | Vercel Cron |

## 4. Middleware de autenticación

`middleware.ts` (matcher `/admin/:path*`, `/login`, `/api/facturas/:path*`):

1. Crea cliente `@supabase/ssr` con cookies de la request y refresca sesión.
2. Sin usuario en `/admin/**` redirige a `/login?next=...`.
3. Con usuario, comprueba claim `app_metadata.role === 'admin'` y `aal2` (MFA verificado); si no, 403/redirect.
4. Añade cabeceras `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
5. Con usuario ya autenticado en `/login`, redirige a `/admin`.

El middleware es solo la primera barrera. Cada server action y cada layout de `/admin` revalidan con `supabase.auth.getUser()` (nunca `getSession()`), y la RLS es la barrera definitiva.

## 5. Server actions (lib/actions)

Todas: `'use server'`, validación `zod`, comprobación de rol, devuelven `{ok, data|error}`, llaman `revalidatePath/Tag`, y registran en `audit_log` si tocan datos de salud.

- `pacientes.ts`: crearPaciente, actualizarPaciente, archivarPaciente, exportarDatosPaciente (derecho de acceso), borrarPaciente (supresión con salvedad de conservación legal).
- `notas.ts`: crearNota, editarNota (cifra con `lib/crypto/clinical.ts`), leerNota (descifra, audita acceso).
- `citas.ts`: crearCita, moverCita, cancelarCita, crearSerieRecurrente, editarSerie (solo esta / esta y siguientes).
- `solicitudes.ts`: enviarSolicitudPublica (anónima, con rate limit), aceptar/rechazarSolicitud.
- `pagos.ts`: registrarPago, anularPago; `facturas.ts`: emitirFactura (numeración correlativa atómica), anularFactura (rectificativa).
- `ajustes.ts`: disponibilidad semanal, bloqueos, tarifas.
- `auth.ts`: login, logout, enrolarMFA.

## 6. Modelo de datos (resumen y RLS)

Tablas: `perfil_profesional`, `pacientes`, `notas_clinicas` (columna `contenido_cifrado bytea`), `servicios`, `disponibilidad`, `bloqueos`, `citas` (con `serie_id`, `rrule`), `solicitudes_cita`, `pagos`, `facturas`, `factura_lineas`, `consentimientos`, `audit_log`.

RLS activada en todas. Política base: `using (auth.jwt()->'app_metadata'->>'role' = 'admin')`. `solicitudes_cita` permite `INSERT` a `anon` solo vía función `security definer` con límites; nada más es legible por anon. `service_role` solo en `lib/supabase/admin.ts` (cron, nunca importado en cliente).

## 7. Variables de entorno

| Variable | Ámbito | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | pública | `https://caromafla.online` |
| `NEXT_PUBLIC_SUPABASE_URL` | pública | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | clave anon (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | secreta, servidor | solo cron/tareas |
| `CLINICAL_ENCRYPTION_KEY` | secreta | 32 bytes base64, AES-256-GCM (con `KEY_VERSION`) |
| `CRON_SECRET` | secreta | autenticación de crons |
| `RESEND_API_KEY`, `EMAIL_FROM` | secreta | emails transaccionales |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | mixta | captcha en reserva/contacto |
| `UPSTASH_REDIS_REST_URL/TOKEN` | secreta | rate limit |
| `ADMIN_EMAIL` | servidor | TODO email de la profesional |

`lib/env.ts` valida con zod al arrancar. `.env.example` en el repo; secretos solo en Vercel (Production/Preview separados) y nunca en Git.

## 8. Despliegue

- Git: `main` -> producción; ramas/PR -> Preview de Vercel con proyecto Supabase de staging.
- Dos proyectos Supabase: `caromafla-staging` y `caromafla-prod`, ambos en UE. Migraciones con `supabase db push` desde CI (GitHub Actions) tras tests.
- Dominio: `caromafla.online` apex + `www` redirigido; DNS en Vercel o registro con A/CNAME; HTTPS automático; HSTS.
- Cabeceras de seguridad en `vercel.json`/`next.config`: CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Cron: `vercel.json` `crons` diario para recordatorios de cita (24 h antes).
- Copias: backups diarios de Supabase (plan Pro con PITR recomendado) + exportación cifrada mensual. TODO decidir plan.
- CI: lint, typecheck, vitest, playwright (humo de rutas públicas y guardas de `/admin`).
- Observabilidad: Vercel Analytics sin cookies (o Plausible), Sentry con scrubbing de datos personales. Nunca registrar contenido clínico en logs.

## 9. Seguridad y RGPD (resumen de arquitectura)

Datos de salud = categoría especial (art. 9 RGPD). Medidas: región UE, DPA con Supabase/Vercel/Resend, MFA obligatorio, cifrado aplicación para notas, RLS, `audit_log`, mínimo dato en emails (sin motivo de consulta), consentimiento explícito en la reserva, plazos de conservación (TODO validar con asesor legal: historia clínica 5 años mínimo según normativa autonómica), registro de actividades de tratamiento y posible EIPD.

## 10. ADRs (MADR 4.0)

Se registran aquí de forma consolidada; al crear el repositorio definitivo se pueden extraer a `docs/decisions/NNNN-*.md`.

### ADR-0001: Next.js App Router + TypeScript + Tailwind
- Status: accepted. Date: 2026-10-09.
- Contexto: web pública con SEO y animaciones más panel privado en una sola base de código.
- Opciones: Next.js App Router; Astro + SPA admin aparte; Remix.
- Decisión: Next.js App Router. Server Components para SEO y server actions para el admin sin API propia.
- Consecuencias: bueno, un solo repo y despliegue nativo en Vercel; malo, curva de RSC y cuidado con la caché.
- Rechazadas: Astro (dos apps, duplicación de auth); Remix (menor integración con Vercel/ecosistema).

### ADR-0002: Supabase (Auth + Postgres + RLS + Storage)
- Status: accepted.
- Contexto: se necesita BD relacional, auth con MFA y aislamiento de datos con poco backend.
- Opciones: Supabase; Firebase; Postgres gestionado (Neon) + Auth.js.
- Decisión: Supabase en región UE.
- Consecuencias: RLS como defensa en profundidad, migraciones SQL versionadas; dependencia del proveedor (mitigada por ser Postgres estándar).
- Rechazadas: Firebase (NoSQL, peor para facturación/relacional); Neon+Auth.js (más piezas que mantener).

### ADR-0003: Una sola app con route groups (público y admin) y no monorepo
- Status: accepted.
- Contexto: un único usuario admin; equipo mínimo.
- Decisión: `app/(public)` y `app/admin` en un proyecto Next.js.
- Consecuencias: simple; aislamiento garantizado por middleware+RLS, no por separación física. Si crece, se puede extraer.
- Rechazadas: monorepo con dos apps (sobrecoste); subdominio admin separado (más DNS/cookies sin beneficio real hoy).

### ADR-0004: Auth de la profesional con email+contraseña + MFA TOTP y rol por claim
- Status: accepted.
- Decisión: sin registro público; usuario creado manualmente; rol `admin` en `app_metadata`; exigir `aal2`.
- Consecuencias: robusto frente a robo de credenciales; riesgo de bloqueo si se pierde el factor (códigos de recuperación, TODO).
- Rechazadas: magic link solo (email comprometido = acceso total); OAuth Google (dependencia y menos control).

### ADR-0005: Defensa en capas: middleware + revalidación en servidor + RLS
- Status: accepted.
- Decisión: middleware solo redirige; la autorización real está en cada acción (`getUser`) y en RLS.
- Rechazadas: confiar solo en middleware (bypass conocido de middleware, p. ej. CVE-2025-29927).

### ADR-0006: Server Actions + zod en lugar de API REST/tRPC
- Status: accepted.
- Decisión: mutaciones por server actions tipadas; únicas rutas API: cron, PDF y health.
- Consecuencias: menos código; hay que proteger acciones públicas (reserva) con captcha y rate limit.
- Rechazadas: tRPC (capa extra sin clientes externos), REST completa (no hay consumidores).

### ADR-0007: Cifrado de notas clínicas a nivel de aplicación (AES-256-GCM)
- Status: accepted.
- Contexto: notas de psicoterapia son datos de salud especialmente sensibles; un acceso a la BD no debería revelarlas.
- Decisión: cifrar `contenido` antes de guardar, clave en variable de entorno con `key_version` para rotación.
- Consecuencias: no hay búsqueda de texto completo en notas; pérdida de la clave = pérdida de datos (backup de clave en gestor de secretos, TODO).
- Rechazadas: solo cifrado en reposo del proveedor (no protege frente a lectura vía SQL/clave service); pgcrypto con clave en BD (clave junto al dato).

### ADR-0008: Vercel (fra1) + Supabase UE, con entornos staging/prod separados
- Status: accepted.
- Decisión: Preview con staging, producción con proyecto propio, migraciones desde CI.
- Consecuencias: datos reales jamás en previews; coste de dos proyectos.
- Rechazadas: VPS propio (operación y parches a cargo de la profesional); un solo proyecto compartido (riesgo de mezclar datos).

### ADR-0009: Citas recurrentes con RRULE almacenada y excepciones
- Status: accepted.
- Decisión: guardar `rrule` en la serie y materializar instancias en `citas` a ventana móvil (12 semanas); ediciones "solo esta" generan excepción.
- Rechazadas: solo expandir en lectura (difícil asociar pagos/notas a cada sesión); crear años por adelantado (ruido y borrados masivos).

### ADR-0010: Reserva pública como solicitud pendiente, no cita directa
- Status: accepted.
- Decisión: `/reservar` crea `solicitud_cita` que la profesional confirma; protegida con Turnstile y rate limit; email sin datos clínicos.
- Consecuencias: evita abuso y reservas no deseadas; algo más de fricción. Revisar autoconfirmación por tipo de servicio más adelante.
- Rechazadas: reserva automática inmediata (spam, solapes, pacientes no adecuados); Calendly externo (datos de salud fuera de la UE/control).

### ADR-0011: Animaciones con Motion (+ GSAP puntual) respetando `prefers-reduced-motion`
- Status: accepted.
- Decisión: componentes `components/motion/*` reutilizables; solo en `(public)`; admin sin animaciones salvo transiciones sutiles. Carga diferida (`next/dynamic`) para no penalizar LCP.
- Rechazadas: CSS-only (insuficiente para escenas de scroll); Three.js a pantalla completa (peso y accesibilidad, valorar solo un elemento decorativo).

### ADR-0012: Facturación propia simple, sin Stripe en la primera versión
- Status: proposed (TODO confirmar fiscalidad con gestor: servicios sanitarios suelen estar exentos de IVA).
- Decisión: registrar pagos manualmente (efectivo, transferencia, Bizum) y emitir facturas PDF con numeración correlativa.
- Rechazadas por ahora: Stripe (comisiones y complejidad; reevaluar para pago online previo a la cita).

## 11. Riesgos abiertos

1. Fiscalidad y obligaciones de facturación (TODO gestor). 2. Plazos de conservación de historias clínicas (TODO asesor). 3. Gestión de clave de cifrado y recuperación MFA. 4. Elección de plan Supabase con backups/PITR. 5. Datos reales de la profesional.
