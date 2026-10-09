# 05 - Spec del panel admin (formato OpenSpec)

Marca: Caromafla (nombre real de la psicóloga: TODO). Stack: Next.js App Router + TypeScript + Tailwind + Supabase (Auth, Postgres con RLS, Storage) en Vercel.
Método: Fission-AI/OpenSpec `openspec-propose` (proposal, specs delta con Requirements/Scenarios, design, tasks). No se ejecutó el CLI (no hay raíz `openspec/`); los artefactos se redactan a mano en este archivo. Solo planificación, sin código.

Cambio: `add-admin-panel`

---

## 1. Proposal

### Por qué
La psicóloga necesita gestionar pacientes, agenda e ingresos en un único sitio privado, sin hojas de cálculo ni herramientas externas. Se tratan datos de salud (categoría especial RGPD art. 9), así que privacidad y trazabilidad son requisitos de primer nivel.

### Qué cambia
- Nueva área privada `/admin` con: dashboard, pacientes, calendario, ingresos y ajustes.
- Autenticación solo para la profesional (Supabase Auth, MFA obligatorio).
- Esquema Postgres con RLS, notas clínicas cifradas, registro de auditoría.

### Capacidades (specs)
`admin-auth`, `admin-dashboard`, `admin-patients`, `admin-calendar`, `admin-income`, `admin-settings`.

### Fuera de alcance (v1)
Multi-profesional/roles complejos, portal del paciente, videollamada integrada, facturación electrónica oficial (Verifactu/TicketBAI: TODO validar con gestor), pasarela de pago online (el registro de pagos es manual en v1; Stripe opcional en v2).

### Supuestos
- Una sola usuaria administradora (rol `owner`); el modelo incluye `owner_id` para escalar a más profesionales.
- Zona horaria `Europe/Madrid` (TODO confirmar), moneda EUR, IVA configurable (psicología sanitaria suele estar exenta: TODO confirmar con gestor).
- Idioma de interfaz: español.

---

## 2. Specs (deltas)

### 2.0 admin-auth

#### Requirement: Acceso restringido
Todas las rutas `/admin/**` y la API asociada SHALL requerir sesión válida de la propietaria.

- Scenario: visitante sin sesión abre `/admin/pacientes` -> redirige a `/admin/login`.
- Scenario: login correcto con email+contraseña y segundo factor TOTP -> accede al dashboard.
- Scenario: 5 intentos fallidos en 10 min -> bloqueo temporal y aviso por email.

#### Requirement: Sesión segura
La sesión SHALL caducar tras 30 min de inactividad y mostrar aviso previo; las cookies serán `httpOnly`, `secure`, `sameSite=lax`. Cabecera `noindex` y `robots` bloqueado en `/admin`.

### 2.1 admin-dashboard

#### Requirement: KPIs
El dashboard SHALL mostrar: citas de hoy, ingresos del mes en curso, pacientes activos.

- Scenario: hay 4 citas hoy (1 cancelada) -> KPI "Citas hoy" muestra 3 y el detalle lista las 4 con estado.
- Scenario: ingresos del mes -> suma de pagos con estado `cobrado` entre el día 1 y hoy; muestra variación % frente al mes anterior.
- Scenario: "Pacientes activos" = pacientes con estado `activo` y al menos una cita en los últimos 90 días (umbral configurable).

#### Requirement: Accesos y alertas
SHALL mostrar próxima cita con cuenta atrás, pagos pendientes, citas sin confirmar, solicitudes de reserva nuevas desde la web pública y atajos "Nueva cita", "Nuevo paciente", "Registrar pago".

- Scenario: sin datos (cuenta nueva) -> estados vacíos con guía de primer uso.

### 2.2 admin-patients

#### Requirement: Lista de pacientes
SHALL listar pacientes con búsqueda por nombre/email/teléfono, filtros (estado, etiqueta), ordenación y paginación en servidor.

- Scenario: buscar "mar" -> resultados insensibles a mayúsculas/acentos en menos de 300 ms con 2.000 pacientes.
- Scenario: archivar paciente -> desaparece de activos, se conserva el historial (no se borra).

#### Requirement: Ficha de paciente
Cada paciente SHALL tener: datos personales (nombre, fecha nacimiento, contacto, contacto de emergencia), modalidad (presencial/online), tarifa por defecto, consentimiento RGPD firmado (fecha + PDF en Storage privado), estado, etiquetas.

- Scenario: alta sin consentimiento -> se permite pero queda marcada con aviso "consentimiento pendiente" y no se pueden guardar notas clínicas hasta registrarlo (configurable).
- Scenario: paciente menor de edad -> exige datos y consentimiento de tutor.

#### Requirement: Historial
La ficha SHALL mostrar línea de tiempo con citas (pasadas/futuras), pagos, documentos y notas, y totales (sesiones, importe cobrado, saldo pendiente).

#### Requirement: Notas clínicas privadas
Las notas de sesión SHALL almacenarse cifradas (nivel aplicación, AES-256-GCM con clave en variable de entorno/KMS, nunca en el cliente), visibles solo a la propietaria, con fecha, cita asociada opcional, plantilla (SOAP/libre) y versionado de ediciones.

- Scenario: la propietaria abre una nota -> se descifra en servidor, se registra acceso en auditoría.
- Scenario: consulta directa a la BD por otro rol -> solo ve texto cifrado y RLS devuelve cero filas.
- Scenario: bloqueo de pantalla tras 5 min sin actividad en la ficha -> oculta notas.

#### Requirement: RGPD
SHALL permitir exportar todos los datos de un paciente (JSON+PDF), rectificar y suprimir (con aviso de plazos legales de conservación de historia clínica: TODO validar con asesor) y mantener registro de auditoría de accesos y cambios.

### 2.3 admin-calendar

#### Requirement: Vistas
El calendario SHALL ofrecer vistas día, semana, mes y agenda (lista), con selector de rango, botón "Hoy", código de color por estado/tipo y diseño responsive (móvil: día/agenda por defecto).

- Scenario: cambiar a vista semana -> se recuerda la preferencia.

#### Requirement: Gestión de citas
Una cita SHALL tener paciente, inicio, duración, modalidad (presencial/online + enlace), tipo de servicio, precio, estado (`pendiente`, `confirmada`, `realizada`, `cancelada`, `ausente`) y nota interna.

- Scenario: crear cita haciendo clic en un hueco vacío -> abre formulario con hora preseleccionada.
- Scenario: solape con otra cita o bloqueo -> aviso y rechazo salvo confirmación explícita ("permitir solape").
- Scenario: marcar `realizada` -> ofrece crear el pago pendiente con la tarifa del paciente.

#### Requirement: Arrastrar y soltar
SHALL permitir mover (drag & drop) y redimensionar citas en día/semana, con ajuste a rejilla de 15 min, validación de conflictos y opción de deshacer durante 10 s.

- Scenario: arrastrar a hueco libre -> actualiza cita y ofrece "notificar al paciente por email".
- Scenario: arrastrar sobre bloqueo -> rechazado con mensaje.
- Scenario: en móvil -> mover mediante formulario ("Reprogramar") además de gesto táctil.

#### Requirement: Recurrencia
SHALL soportar citas recurrentes (semanal, quincenal, mensual, hasta fecha o N ocurrencias) con edición de "solo esta", "esta y siguientes" o "toda la serie".

- Scenario: serie semanal de 12 sesiones, se cancela la 5ª -> solo esa pasa a `cancelada`.
- Scenario: festivo/bloqueo cae en una ocurrencia -> se marca como conflicto y se propone alternativa.
- Scenario: cambio de horario a mitad de año (DST) -> la hora local se mantiene.

#### Requirement: Bloqueos y disponibilidad
SHALL permitir bloqueos puntuales y recurrentes (vacaciones, comida, formación) y horario semanal de disponibilidad que alimenta la reserva pública.

- Scenario: crear bloqueo de 1-15 agosto -> la web pública no ofrece huecos en esas fechas.
- Scenario: bloqueo sobre citas existentes -> lista las afectadas y pide resolverlas.

#### Requirement: Solicitudes de reserva
Las reservas desde la web pública SHALL llegar como `pendiente` y requerir confirmación; al confirmar se envía email al paciente (archivo .ics adjunto).

#### Requirement: Recordatorios
SHALL enviar recordatorio por email 24 h antes (configurable) y permitir enlace de cancelación/reprogramación con límite horario de política (TODO confirmar política, p. ej. 24 h).

### 2.4 admin-income

#### Requirement: Registrar pago
SHALL permitir registrar pago con paciente, cita opcional, importe, método (efectivo, transferencia, Bizum, tarjeta, otro), fecha, estado (`pendiente`, `cobrado`, `reembolsado`) y concepto.

- Scenario: pago parcial -> el saldo pendiente de la cita se actualiza.
- Scenario: importe negativo o cero -> validación rechaza.
- Scenario: reembolso -> crea movimiento negativo enlazado, no borra el original.

#### Requirement: Facturas PDF
SHALL generar facturas/recibos en PDF con numeración correlativa por serie y año, datos fiscales de la profesional y del paciente, base, IVA/exención con mención legal, y almacenarlas en Storage privado.

- Scenario: emitir factura -> asigna número `2026-0001`, bloquea edición; corrección mediante factura rectificativa.
- Scenario: dos emisiones simultáneas -> la numeración no se duplica ni deja huecos (secuencia en BD con bloqueo transaccional).
- Scenario: enviar por email al paciente desde la app.
- Nota: cumplimiento fiscal real (Verifactu, retención IRPF) = TODO validar con gestor.

#### Requirement: Gráficos mensuales
SHALL mostrar ingresos por mes (barras, últimos 12 meses), por método de pago, por servicio y acumulado anual, con selector de año y comparativa con el año anterior; accesibles (tabla alternativa, paleta con contraste).

- Scenario: mes sin ingresos -> barra a cero, no hueco.
- Scenario: filtro por rango y servicio -> gráficos y totales coinciden con la tabla.

#### Requirement: Exportar CSV
SHALL exportar pagos y facturas filtrados a CSV (UTF-8 con BOM, separador `;`, decimales con coma, fechas ISO) para el gestor.

- Scenario: exportar mes de marzo -> fichero `ingresos-2026-03.csv` con una fila por pago y totales coincidentes con pantalla.
- Scenario: celdas que empiezan por `=`, `+`, `-`, `@` -> se escapan para evitar inyección de fórmulas.

#### Requirement: Pendientes de cobro
SHALL listar citas realizadas sin pago completo con antigüedad y acción rápida "marcar cobrado".

### 2.5 admin-settings

#### Requirement: Perfil y datos fiscales
Editar nombre comercial, titulación, nº colegiado (TODO), NIF, dirección, logo, firma y pie legal de facturas.

#### Requirement: Servicios y tarifas
CRUD de servicios (nombre, duración, precio, modalidad, visible en web pública) usados por calendario, pagos y página de tarifas.

#### Requirement: Horario y reservas
Horario semanal, duración de huecos, antelación mínima/máxima, política de cancelación, festivos.

#### Requirement: Notificaciones y plantillas
Plantillas editables de email (confirmación, recordatorio, cancelación) con variables.

#### Requirement: Seguridad y datos
Cambiar contraseña, gestionar MFA, ver sesiones activas, consultar registro de auditoría, copia de seguridad/exportación completa, retención de datos.

---

## 3. Design

### Arquitectura
- Next.js App Router; rutas `/admin/(dashboard|pacientes|calendario|ingresos|ajustes)`; Server Components para lectura, Server Actions/Route Handlers para escritura con validación Zod.
- Middleware comprueba sesión y MFA (`aal2`) en `/admin/**`.
- Supabase: Auth (email+TOTP), Postgres con RLS (`owner_id = auth.uid()` en todas las tablas), Storage con buckets privados (`consents`, `invoices`, `documents`) y URLs firmadas de corta vida.
- Cifrado de notas: en servidor (`crypto` AES-256-GCM, IV por registro, clave `NOTES_KEY` en variables de Vercel; rotación con campo `key_version`). Alternativa evaluada: pgsodium/Vault; se elige cifrado de aplicación por portabilidad.
- Email: Resend (o similar, TODO) con plantillas React Email. PDF: `@react-pdf/renderer` en Route Handler (runtime Node).
- Calendario: FullCalendar o librería headless propia (decidir en spike; criterios: drag&drop, recurrencia, accesibilidad, peso). Recurrencia con RRULE (RFC 5545, lib `rrule`), guardando regla + excepciones, expandidas por rango.
- Gráficos: Recharts o visx con paleta accesible; agregaciones en SQL (vistas/RPC), no en cliente.
- Estado/UX: TanStack Query para caché y actualizaciones optimistas del calendario; skeletons; modo oscuro.

### Modelo de datos (resumen)
- `profiles(id, owner_id, nombre, nif, direccion, ...)`
- `services(id, owner_id, nombre, duracion_min, precio, modalidad, publico)`
- `patients(id, owner_id, nombre, apellidos, email, telefono, fecha_nac, estado, tarifa_defecto, tutor jsonb, consentimiento_at, consentimiento_path, etiquetas text[], archived_at)`
- `appointments(id, owner_id, patient_id, service_id, starts_at timestamptz, ends_at, estado, modalidad, enlace, precio, series_id null, nota)` con restricción `EXCLUDE USING gist` sobre rango para impedir solapes.
- `appointment_series(id, rrule, dtstart, tz, excepciones jsonb)`
- `blocks(id, owner_id, starts_at, ends_at, rrule null, motivo)`
- `availability(owner_id, weekday, desde, hasta)`
- `clinical_notes(id, patient_id, appointment_id null, ciphertext bytea, iv, key_version, plantilla, created_at, updated_at)` + `clinical_note_versions`
- `payments(id, owner_id, patient_id, appointment_id null, invoice_id null, importe_cent int, metodo, estado, fecha, concepto, refund_of null)` (importes en céntimos enteros)
- `invoices(id, owner_id, serie, numero, anio, patient_id, base_cent, iva_pct, total_cent, pdf_path, estado, rectifica_id null)` con `UNIQUE(owner_id, serie, anio, numero)`
- `audit_log(id, owner_id, actor, accion, entidad, entidad_id, at, ip)` solo inserción.
- `booking_requests(id, datos, estado, created_at)` (escritura pública vía endpoint con captcha y rate limit; sin acceso de lectura público).

### Decisiones
1. Importes en céntimos enteros; nunca floats.
2. Todas las fechas en UTC en BD, mostradas en `Europe/Madrid`; recurrencia guardada con tz para sobrevivir al cambio horario.
3. Borrado lógico de pacientes; borrado físico solo por solicitud RGPD tras comprobar retención.
4. Auditoría de lectura de notas clínicas.
5. Sin analítica de terceros ni cookies de tracking en `/admin`.

### Riesgos
- Fuga de datos de salud (mitigación: RLS, cifrado, MFA, auditoría, pruebas de RLS automatizadas).
- Complejidad de recurrencia/DST (mitigación: RRULE + tests con casos de cambio horario).
- Requisitos fiscales de facturación (mitigación: validar con gestor antes de lanzar).
- Pérdida de datos (mitigación: backups Supabase PITR + exportación manual).

### Preguntas abiertas
Nombre real y datos fiscales; IVA/exención; política de cancelación; si hay cobro online en v2; retención legal de historias; proveedor de email.

---

## 4. Tasks

### 4.1 Base y seguridad
- [ ] Proyecto Next.js + Tailwind + Supabase, variables de entorno, CI (lint, tipos, tests)
- [ ] Migraciones: tablas, índices, `EXCLUDE` anti-solape, RLS por tabla
- [ ] Tests automáticos de RLS (otro usuario / anónimo = 0 filas)
- [ ] Auth: login, MFA TOTP, middleware `aal2`, timeout de sesión, rate limit
- [ ] Layout admin: sidebar, topbar, navegación móvil, tema claro/oscuro, `noindex`
- [ ] Auditoría: tabla y helper `logAudit`

### 4.2 Pacientes
- [ ] Lista con búsqueda, filtros, paginación servidor
- [ ] Alta/edición con Zod, caso menor de edad
- [ ] Subida de consentimiento a Storage privado + URL firmada
- [ ] Ficha con timeline e indicadores
- [ ] Notas cifradas: servicio crypto, editor, versionado, bloqueo por inactividad
- [ ] Exportar/suprimir datos del paciente (RGPD)

### 4.3 Calendario
- [ ] Vistas día/semana/mes/agenda, responsive
- [ ] CRUD de citas, estados, detección de solapes
- [ ] Drag & drop y resize con rejilla 15 min, deshacer
- [ ] Recurrencia RRULE con edición de una/siguientes/serie
- [ ] Bloqueos y disponibilidad semanal; endpoint de huecos para web pública
- [ ] Solicitudes de reserva: bandeja, confirmar/rechazar, email + .ics
- [ ] Recordatorios por email (cron Vercel / Supabase scheduled function)
- [ ] Tests de DST y recurrencia

### 4.4 Ingresos
- [ ] Registrar pago, parciales y reembolsos
- [ ] Pendientes de cobro
- [ ] Facturas: numeración transaccional, PDF, rectificativas, envío por email
- [ ] Vistas SQL de agregación + gráficos mensuales/método/servicio
- [ ] Exportación CSV segura (BOM, `;`, escape de fórmulas)
- [ ] Revisión fiscal con gestor

### 4.5 Dashboard y ajustes
- [ ] KPIs (citas hoy, ingresos mes, pacientes activos) con variaciones
- [ ] Próxima cita, alertas, atajos, estados vacíos
- [ ] Ajustes: perfil fiscal, servicios/tarifas, horario, plantillas de email
- [ ] Seguridad: contraseña, MFA, sesiones, auditoría, backup/exportación

### 4.6 Calidad
- [ ] Tests unitarios (crypto, recurrencia, importes), e2e Playwright (login, crear cita, pago, factura)
- [ ] Accesibilidad (teclado en calendario, contraste en gráficos) y rendimiento
- [ ] Revisión de privacidad/RGPD (registro de actividades, encargados de tratamiento: Supabase, Vercel, email)
- [ ] Despliegue Vercel, dominio caromafla.online, backups y monitorización de errores sin datos personales

### Criterios de aceptación globales
Ninguna ruta admin accesible sin MFA; ninguna nota clínica en claro en BD ni logs; calendario sin solapes posibles a nivel de BD; totales de dashboard, gráficos y CSV coinciden; Lighthouse accesibilidad >= 95 en `/admin`.
