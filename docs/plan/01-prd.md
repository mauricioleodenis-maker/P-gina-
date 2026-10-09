# PRD: Caromafla.online, web y panel de gestión para consulta de psicología

Versión 0.1 · 2026-10-09 · Skill: emi:planifica / lazzyms prd
Etiquetas: `Known` / `Assumption` / `Risk` / `Open Question` / `TODO-DATO` (dato real pendiente)

## 1. Descripción
Sitio web nuevo para la consulta de psicología "Caromafla" (marca provisional). Tiene dos partes: una web pública animada que presenta a la profesional, sus terapias y tarifas y permite pedir cita, y un panel privado de administración para gestionar pacientes, calendario, ingresos y dashboard. Stack: Next.js (App Router, TypeScript, Tailwind) + Supabase (Auth, Postgres con RLS, Storage) en Vercel.

## 2. Problema
- Visitantes: no encuentran con claridad quién es la psicóloga, qué trata, cuánto cuesta ni cómo reservar; abandonan o llaman/escriben por WhatsApp, lo que genera ida y vuelta.
- Psicóloga (admin): agenda, fichas, notas y cobros dispersos (papel, hojas de cálculo, agenda personal). Riesgo de errores, citas solapadas y poca visibilidad de ingresos.
- Datos de salud son categoría especial RGPD (art. 9): exigen consentimiento explícito, minimización, cifrado y control de acceso.

## 3. Por qué (evidencia)
- `Known`: tratamiento de datos de salud obliga a medidas reforzadas (RGPD art. 9, LOPDGDD, secreto profesional).
- `Assumption`: la consulta es unipersonal, con 10-40 pacientes activos y 15-35 sesiones/semana. TODO-DATO confirmar.
- `Assumption`: hoy la reserva es por teléfono/WhatsApp y hay pérdida de consultas fuera de horario.
- `Open Question`: existe web actual o dominio con tráfico? Hay que migrar contenido o SEO?

## 4. Éxito (métricas)
| Métrica | Definición | Meta (3 meses tras lanzamiento) |
|---|---|---|
| Solicitudes de cita web | Formularios de reserva enviados / mes | >= 15/mes (`Assumption`) |
| Conversión visita-solicitud | Solicitudes / sesiones únicas | >= 3% |
| Tiempo de gestión administrativa | Horas semanales declaradas por la psicóloga | -50% vs. situación actual |
| Citas sin registrar | Citas en agenda sin pago/estado cerrado a 7 días | < 5% |
| Rendimiento web | Lighthouse móvil: Performance / Accesibilidad / SEO | >= 90 / >= 95 / >= 95; LCP < 2,5 s |
| Seguridad/RGPD | Incidencias de datos; tablas con RLS | 0 incidencias; 100% tablas con RLS |
| Disponibilidad | Uptime mensual | >= 99,5% |

## 5. Audiencia
**Persona A, Psicóloga/administradora (única usuaria del panel).** Poco tiempo técnico, usa móvil y portátil, necesita ver la semana de un vistazo, registrar notas rápido y saber cuánto ingresa. Exige confidencialidad total.
**Persona B, Paciente potencial (visitante).** Adulto 25-55 (también padres/madres que consultan por hijos), llega por Google, redes o recomendación, desde móvil, con ansiedad al dar el primer paso: busca confianza, claridad de precio y reserva sencilla y discreta.
**Persona C, Paciente existente.** Recibe recordatorios de cita; en futuro, portal propio.
Retención/mensajería: email transaccional de confirmación y recordatorio 24 h antes (con opt-in).

## 6. Qué (alcance)
### 6.1 Web pública
Inicio (hero animado, propuesta, CTA reserva), Sobre mí (formación, nº colegiado TODO-DATO), Servicios/terapias (individual, pareja, adolescentes, online/presencial; TODO-DATO lista real), Tarifas, Reserva de cita, Contacto (formulario, mapa, WhatsApp), Blog opcional (MDX), Legal RGPD (aviso legal, privacidad, cookies con banner de consentimiento), SEO local (JSON-LD, sitemap), accesibilidad WCAG 2.2 AA, animaciones con respeto a `prefers-reduced-motion`.

### 6.2 Panel admin (privado, autenticado)
- Dashboard: citas de hoy/semana, solicitudes pendientes, ingresos del mes, pacientes activos.
- Pacientes: alta/edición, ficha (contacto, motivo, consentimientos firmados), historial de sesiones, notas clínicas privadas y cifradas, archivos en Storage privado.
- Calendario: vistas día/semana/mes, citas únicas y recurrentes, estados (pendiente, confirmada, realizada, cancelada, no asistió), detección de solapes, disponibilidad configurable.
- Ingresos: pagos por sesión (efectivo, transferencia, tarjeta, Bizum), facturas/recibos numerados en PDF, gráficos (mensual, por tipo de terapia), exportación CSV.
- Ajustes: horarios, tipos de sesión y tarifas, datos fiscales, plantillas de email.

### 6.3 Historias de usuario (prioridad MoSCoW)
Visitante:
1. Como visitante quiero entender en 10 s qué trata y a quién, para decidir si me sirve. (Must)
2. Como visitante quiero ver tarifas claras, para no dudar por el precio. (Must)
3. Como visitante quiero elegir un hueco libre y solicitar cita sin crear cuenta, para reservar rápido. (Must)
4. Como visitante quiero aceptar la política de privacidad y consentimiento de forma explícita antes de enviar datos. (Must)
5. Como visitante quiero recibir confirmación por email. (Must)
6. Como visitante quiero usar la web cómodamente desde el móvil. (Must)
7. Como visitante quiero leer artículos del blog. (Could)
Psicóloga:
8. Como admin quiero iniciar sesión de forma segura (email + 2FA). (Must)
9. Como admin quiero ver y aprobar/rechazar solicitudes de cita. (Must)
10. Como admin quiero crear y mover citas en un calendario, incluidas recurrentes. (Must)
11. Como admin quiero crear fichas de paciente y escribir notas privadas cifradas. (Must)
12. Como admin quiero registrar pagos y emitir recibos/facturas. (Must)
13. Como admin quiero un dashboard con ingresos y citas. (Should)
14. Como admin quiero exportar o eliminar los datos de un paciente (derechos RGPD). (Must)
15. Como admin quiero recordatorios automáticos a pacientes. (Should)
16. Como admin quiero bloquear vacaciones y festivos. (Should)

### 6.4 MVP vs. futuro
| MVP (v1) | Futuro (v2+) |
|---|---|
| Web pública completa, reserva por solicitud, legal/cookies | Blog con CMS, multiidioma |
| Auth admin + 2FA, pacientes, notas cifradas | Portal del paciente, cuestionarios previos |
| Calendario d/s/m + recurrentes, solapes | Sincronización Google Calendar |
| Pagos, recibos PDF, dashboard básico | Pasarela online (Stripe), facturación electrónica, informes fiscales |
| Email de confirmación y recordatorio | WhatsApp/SMS, videollamada integrada |
| Backups, logs de auditoría | Multi-profesional, app móvil/PWA |

### 6.5 Fuera de alcance (v1)
Diagnóstico automático o IA clínica, teleconsulta propia, historia clínica con firma electrónica cualificada, multi-profesional, pagos online.

### 6.6 Restricciones y dependencias
- RGPD/LOPDGDD: base legal consentimiento explícito; registro de actividades; DPA con Supabase, Vercel y proveedor de email; datos en región UE; DPIA recomendada. `Risk` alto si se incumple.
- Cifrado de notas a nivel de aplicación (clave fuera de la BD) además de cifrado en reposo; RLS en todas las tablas; bucket privado con URLs firmadas.
- Sin datos clínicos en analítica ni logs; analítica sin cookies o con consentimiento.
- Secreto profesional: la psicóloga es la única con acceso.

### 6.7 Casos límite
Doble reserva simultánea del mismo hueco (bloqueo transaccional); cita recurrente con excepciones; cancelación tardía; paciente menor (consentimiento de tutor); cambio horario verano/invierno (zona Europe/Madrid); solicitud duplicada; pérdida del 2FA (códigos de recuperación); borrado de paciente con facturas emitidas (conservar datos fiscales el plazo legal, anonimizar clínicos).

### 6.8 Diseño y copy
Diseño: TODO (se definirá en el siguiente paso con emi:pages: paleta serena, tipografía legible, animaciones suaves). Copy: tono cercano, profesional y no alarmista; textos reales TODO-DATO.

## 7. Cómo (experimentos)
No aplica experimento formal en v1. Se usan feature flags simples para publicar el blog y la reserva. Se medirá conversión de la reserva y se iterará.

## 8. Cuándo (hitos tentativos)
| Fase | Contenido | Duración |
|---|---|---|
| 0 | Plan, PRD, arquitectura, diseño | 1 semana |
| 1 | Web pública + legal + SEO | 2 semanas |
| 2 | Auth, pacientes, notas cifradas | 2 semanas |
| 3 | Calendario y reservas, emails | 2 semanas |
| 4 | Ingresos, facturas, dashboard | 2 semanas |
| 5 | QA, seguridad, accesibilidad, lanzamiento y DNS caromafla.online | 1 semana |

## 9. Preguntas abiertas
Nombre real y nº de colegiado; modelo fiscal (autónoma, IVA exento sanidad?); datos de facturación; logo y fotos; precios; modalidad online/presencial y dirección; reserva con confirmación manual o automática; proveedor de email; quién redacta los textos legales (recomendada revisión por abogado/DPO).

## 10. Herramientas de terceros
Vercel (hosting), Supabase (Auth, BD, Storage), Resend o similar (email), librería de calendario (FullCalendar o propia), Recharts (gráficos), GSAP/Motion (animaciones), gestor de consentimiento de cookies.

## 11. Seeding
Cargar servicios, tarifas, horarios y textos legales antes del lanzamiento; opcional importar pacientes actuales desde CSV.

## 12. Go to market
SEO local (Google Business Profile), enlaces en redes y directorios de psicólogos, redirecciones desde la web antigua si existe. Riesgos: fuga de datos (mitigar con RLS, cifrado, auditoría), baja conversión (iterar CTA), incumplimiento legal (revisión jurídica). Checklist: legal publicado, backups probados, 2FA activo, DNS/SSL, Lighthouse, prueba de reserva extremo a extremo.

## 13. Glosario
RLS: seguridad por filas en Postgres. DPIA: evaluación de impacto de protección de datos. 2FA: doble factor. Categoría especial: datos de salud (RGPD art. 9). Recurrente: cita que se repite semanal/quincenal.

## Siguiente paso
Aprobado este PRD, el skill `erd` del mismo paquete produce el diseño técnico (modelo de datos, arquitectura, RLS).
