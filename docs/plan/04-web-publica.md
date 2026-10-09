# Especificación: Web pública de Caromafla (caromafla.online)

**Formato**: spec-kit (User Scenarios, Requirements, Key Entities, Success Criteria, `[NEEDS CLARIFICATION]`)
**Stack**: Next.js (App Router, TS, Tailwind) + Supabase + Vercel
**Estado**: Borrador. Todo dato real marcado `TODO:`. Marca provisional: "Caromafla".

> Nota: el directorio `github__spec-kit` de emi/planifica solo contiene LICENSE (sus skills son de code-review y catálogo de extensiones). Se aplica el formato de plantilla spec de Spec Kit (spec-template) de memoria.

## 1. Alcance y principios
Web pública de consulta de psicología. Objetivo: transmitir calma y confianza, y convertir visitas en citas reservadas. Datos de salud = categoría especial RGPD: recoger lo mínimo en la reserva (nunca motivo clínico detallado).
Tono: cálido, cercano, profesional, sin promesas de curación ni lenguaje alarmista (código deontológico).
Animaciones: suaves (fade/slide al scroll, parallax sutil), respetan `prefers-reduced-motion`.

## 2. Mapa del sitio
| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/sobre-mi` | Sobre mí |
| `/servicios` y `/servicios/[slug]` | Terapias |
| `/tarifas` | Tarifas |
| `/reservar` | Reserva de cita (flujo) |
| `/reservar/confirmacion/[id]` | Confirmación |
| `/contacto` | Contacto |
| `/blog`, `/blog/[slug]` | Blog (opcional, fase 2) |
| `/aviso-legal`, `/privacidad`, `/cookies`, `/consentimiento-informado` | Legal RGPD |

Componentes globales: cabecera sticky con CTA "Reservar cita", pie con contacto/legal, botón flotante WhatsApp (TODO), banner de cookies, aviso de crisis ("Si estás en una situación de urgencia, llama al 112 o al 024 (línea de conducta suicida)").

## 3. Historias de usuario (User Scenarios)
1. **P1** Como persona que busca terapia, quiero entender en menos de 30 s qué ofrece y cómo reservar. *Aceptación*: hero con propuesta y CTA visible sin scroll en móvil.
2. **P1** Como paciente nuevo, quiero reservar sin llamar. *Aceptación*: reserva completada en <3 min y ≤4 pasos, con email de confirmación.
3. **P2** Como visitante dudoso, quiero conocer a la psicóloga, enfoque y tarifas antes de decidir.
4. **P2** Como paciente, quiero cancelar/reprogramar desde un enlace del email (hasta 24 h antes).
5. **P3** Como lector, quiero artículos del blog para orientarme.

Casos límite: hueco ocupado mientras se reserva (409 → proponer alternativas); doble envío; zona horaria (siempre Europe/Madrid); menor de edad (requiere tutor, ver §6); JS desactivado (contenido legible, reserva con mensaje de contacto alternativo).

## 4. Secciones y copy de ejemplo por página

### 4.1 Inicio `/`
1. **Hero**: H1 "Un espacio tranquilo para entenderte y sentirte mejor". Sub: "Terapia psicológica individual, presencial y online, con un enfoque cercano y basado en la evidencia." CTAs: [Reservar primera cita] [Conocer más]. Fondo con formas orgánicas animadas.
2. **Cómo puedo ayudarte**: tarjetas (ansiedad, estado de ánimo, autoestima, duelo, pareja, estrés laboral) con enlace a servicio. Microcopy: "No hace falta tener las palabras exactas. Empezamos por donde tú estés."
3. **Cómo es el primer paso**: 3 pasos animados: "1. Eliges día y hora · 2. Hablamos 50 minutos sin compromiso · 3. Diseñamos juntas/os un plan".
4. **Sobre mí (resumen)**: foto (TODO) + 3 líneas + enlace.
5. **Modalidades**: presencial (dirección TODO) / online (videollamada segura).
6. **Testimonios**: solo con consentimiento escrito; si no, omitir (TODO). Alternativa: valores de la consulta.
7. **FAQ** (acordeón): "¿Cuánto dura una sesión?" "¿Es confidencial?" "¿Cuántas sesiones necesitaré?" "¿Puedo cancelar?"
8. **CTA final**: "Dar el primer paso es lo más difícil. Yo te acompaño en el resto."

### 4.2 Sobre mí
Historia breve y humana, formación y colegiación (nº TODO), enfoque (p. ej. cognitivo-conductual, ACT; TODO confirmar), valores (respeto, confidencialidad, sin juicios), línea de tiempo animada. Copy: "Soy {Nombre TODO}, psicóloga sanitaria. Creo que la terapia funciona cuando te sientes seguro/a para ser tal como eres."

### 4.3 Servicios `/servicios`
Listado + página por servicio con: a quién va dirigido, qué trabajamos, cómo es el proceso, duración, modalidad, FAQ y CTA a reservar con el servicio preseleccionado. Servicios iniciales (TODO confirmar): Primera consulta (50 min), Terapia individual adultos, Terapia online, Terapia de pareja, Adolescentes (con tutor), Sesión de seguimiento.

### 4.4 Tarifas
Tabla clara por servicio (precios TODO), formas de pago, política de cancelación (24 h), facturas deducibles/mutuas (TODO), bonos opcionales. Copy: "Sin letra pequeña: lo que ves es lo que pagas."

### 4.5 Contacto
Formulario (nombre, email, mensaje, casilla de privacidad) con anti-spam (Turnstile/honeypot), teléfono, WhatsApp, email, dirección y mapa (TODO), horarios. Mensaje: "Respondo en menos de 24 h laborables."

### 4.6 Blog (fase 2)
MDX o Supabase; categorías, tiempo de lectura, JSON-LD Article.

### 4.7 Legal RGPD
Aviso legal (LSSI), política de privacidad (responsable, finalidad, base legal art. 9.2.h/a, plazos de conservación, derechos, encargados: Supabase, Vercel, email; TODO DPO/contacto), cookies (solo técnicas por defecto; analítica con consentimiento), consentimiento informado de tratamiento.

## 5. Flujo de reserva (`/reservar`)
Paso a paso con barra de progreso, un solo objetivo por pantalla, guardado en `sessionStorage` (solo selección, sin datos personales sensibles).

1. **Servicio**: tarjetas con duración, modalidad y precio. Si viene de `/servicios/x`, preseleccionado.
2. **Hueco libre**: selector de modalidad (si aplica) + calendario mensual y lista de horas del día. Disponibilidad leída de la agenda del admin (horario laboral, bloqueos, citas existentes, buffer entre sesiones). Zona horaria Europe/Madrid mostrada. Antelación mínima 12 h y máxima 60 días (TODO configurable). Hueco retenido 10 min al seleccionarlo (hold).
3. **Datos**: nombre, email, teléfono, fecha de nacimiento o "soy mayor de 18" (si no, datos de tutor), nota opcional **sin información clínica** (aviso visible), casillas: política de privacidad (obligatoria), consentimiento para tratar datos de salud (obligatoria, art. 9.2.a), recordatorios (opcional). Sin cuenta de paciente.
4. **Confirmación**: resumen, pantalla con animación de éxito, email con .ics, enlace firmado de cancelar/reprogramar, instrucciones (dirección o enlace de videollamada). Estado inicial `pending` o `confirmed` según ajuste del admin (TODO).

**Requisitos funcionales (FR)**
- FR-001 La disponibilidad se calcula en servidor; el cliente nunca decide.
- FR-002 La creación de cita usa transacción con restricción de exclusión (sin solapes) para evitar doble reserva.
- FR-003 Rate limit por IP/email y captcha invisible.
- FR-004 Crea/actualiza paciente en Supabase mediante Server Action con service role; la web pública no lee tablas de pacientes (RLS cerrado).
- FR-005 Emails transaccionales (confirmación, recordatorio 24 h, cancelación) y aviso a la psicóloga.
- FR-006 Cancelación/reprogramación por token firmado, hasta 24 h antes; después, contactar.
- FR-007 Registro de consentimientos con fecha, versión del texto e IP hasheada.
- FR-008 Mensajes de error amables y recuperables (hueco tomado → siguientes 3 alternativas).
- FR-009 Opción "No encuentro hueco": formulario de lista de espera.
- FR-010 Eventos de analítica sin datos personales (paso alcanzado, abandono), solo con consentimiento.

## 6. Entidades clave (lado público)
`services` (id, slug, nombre, duración, precio, modalidad, activo) · `availability_rules` · `time_off` · `appointments` (id, service_id, patient_id, inicio, fin, estado, token_hash) · `patients` (mínimos) · `consents` · `contact_messages` · `waitlist` · `posts`.
Menores: la reserva exige datos y consentimiento del tutor legal; TODO confirmar edad mínima de atención (`[NEEDS CLARIFICATION]`).

## 7. SEO
- Next Metadata API por página; títulos únicos (<60) y descripciones (<155). Ej.: "Psicóloga en {Ciudad TODO} | Terapia presencial y online | Caromafla".
- SEO local: JSON-LD `Psychologist`/`MedicalBusiness` + `LocalBusiness` (NAP coherente), `FAQPage`, `Article`, `BreadcrumbList`; ficha de Google Business (TODO).
- `sitemap.xml`, `robots.txt` (bloquear `/admin`, `/reservar/confirmacion`), canonical, Open Graph/Twitter con imagen generada (`opengraph-image`).
- Rendimiento: SSG/ISR para contenido, `next/image`, `next/font`, LCP <2,5 s, CLS <0,1, INP <200 ms; animaciones con transform/opacity.
- URLs semánticas en español, enlazado interno desde servicios a reserva, `lang="es"`.
- `noindex` en confirmación y legal secundario.

## 8. Accesibilidad (WCAG 2.2 AA)
- Contraste ≥4,5:1 (paleta suave verificada), foco visible, objetivos táctiles ≥44 px.
- Navegación por teclado completa; skip link; landmarks (`header/nav/main/footer`); un único H1.
- Formularios con `label`, errores asociados (`aria-describedby`, `role="alert"`), autocompletado (`autocomplete`), sin depender del color.
- Calendario de reserva accesible (rejilla con `aria-label`, flechas del teclado, alternativa de lista de horas).
- `prefers-reduced-motion` desactiva parallax y reduce transiciones; sin autoplay con sonido; nada parpadea.
- Alt en imágenes, subtítulos en vídeo, `lang` correcto, texto redimensionable al 200 %.
- Pruebas: axe/Lighthouse en CI, revisión manual con lector de pantalla.

## 9. Criterios de éxito
- SC-001 Reserva completa en ≤3 min, ≥85 % de éxito en pruebas con 5 usuarios.
- SC-002 Lighthouse móvil: Performance ≥90, Accesibilidad ≥95, SEO ≥95.
- SC-003 0 dobles reservas en pruebas de concurrencia.
- SC-004 0 datos clínicos en formularios públicos ni en analítica.
- SC-005 Todos los TODO de datos reales resueltos antes de publicar.

## 10. Puntos abiertos
`[NEEDS CLARIFICATION]`: nombre real y colegiación; ciudad/dirección; enfoques terapéuticos; precios; edad mínima; confirmación automática vs manual; testimonios; blog en lanzamiento; pasarela de pago online en reserva (hoy: pago en consulta).
