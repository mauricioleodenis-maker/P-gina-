# 06 - Seguridad y RGPD (datos de salud) - caromafla.online

Estado: plan. Método: no existe un skill de seguridad/compliance en `planifica/INDEX.md`; se aplicó la lente adversarial de `bmad-review` (bmad-code-org__BMAD-METHOD/skills/bmad-review) como registro de riesgos (sección 14). Esto es un plan técnico, no asesoría jurídica: debe validarlo un DPO/abogado.

Datos reales pendientes (TODO): nombre completo y nº de colegiada de la psicóloga, NIF, domicilio, email de contacto, datos de inscripción AEPD si aplica, proveedor de facturación.

## 1. Marco y principios

- Los datos de salud son categoría especial (art. 9 RGPD; LOPDGDD). Base legal: art. 9.2.h (asistencia sanitaria, bajo secreto profesional) + consentimiento explícito para lo accesorio (recordatorios, newsletter). Contrato (art. 6.1.b) para citas y facturación.
- Principios: minimización, limitación de finalidad, limitación del plazo, integridad y confidencialidad, privacidad por diseño y por defecto.
- Responsable del tratamiento: la psicóloga (TODO datos). Encargados (art. 28): Supabase, Vercel, proveedor de email, proveedor de pagos. Firmar DPA con cada uno.
- EIPD (art. 35): obligatoria por tratamiento a escala de datos de salud; hacer una versión simplificada antes de salir a producción (plantilla en sección 13).
- Regla de oro: la web pública NO almacena nada clínico. El formulario de reserva y contacto recoge solo lo mínimo (nombre, email, teléfono, motivo genérico opcional y corto). Se advierte "no incluyas datos clínicos".

## 2. Autenticación

- Supabase Auth, email + contraseña. Registro público DESHABILITADO: solo la psicóloga (y, si procede, un rol auxiliar) existe como usuario. Los pacientes no tienen cuenta en la fase 1 (portal de paciente = fase 2 opcional).
- 2FA obligatoria (TOTP, Supabase MFA). Políticas:
  - El panel exige nivel de aseguramiento `aal2`; sin él, redirección a verificar/enrolar.
  - 10 códigos de recuperación generados al enrolar, guardados offline por la usuaria. Segundo factor de respaldo (otro TOTP en otro dispositivo) o passkey/WebAuthn cuando Supabase lo soporte.
  - Procedimiento de recuperación de cuenta documentado (verificación manual de identidad, solo el administrador técnico).
- Contraseña: mínimo 12 caracteres, comprobación contra filtraciones (HIBP, activar "leaked password protection" de Supabase), sin reglas de composición absurdas, gestor de contraseñas recomendado.
- Sesiones: JWT de vida corta (1 h), refresh rotativo, cookies httpOnly + Secure + SameSite=Lax vía `@supabase/ssr`; cierre por inactividad a 30 min en el cliente y reautenticación para acciones sensibles (ver notas, exportar, borrar).
- Protección anti fuerza bruta: rate limit de Supabase Auth + límite adicional por IP en el endpoint de login (Vercel/Upstash o middleware); CAPTCHA (Turnstile) tras 3 fallos y en formularios públicos.
- Autorización: toda ruta `/admin/**` protegida en middleware (comprobación de sesión + aal2) Y en cada Server Action/Route Handler (defensa en profundidad; el middleware nunca es la única barrera). Lista de emails permitidos en tabla `staff`.
- Emails de auth con dominio propio (SPF, DKIM, DMARC) para evitar suplantación.

## 3. Modelo de datos y RLS (Postgres)

- RLS activado en TODAS las tablas del esquema `public` (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY; FORCE`), sin excepciones; CI falla si hay una tabla sin RLS (consulta a `pg_tables`/`pg_class.relrowsecurity`).
- Tabla `staff(user_id, role)`; función `is_staff()` `SECURITY DEFINER` con `search_path` fijo. Políticas: `USING (is_staff() AND (auth.jwt()->>'aal') = 'aal2')`.
- Tablas sensibles: `patients`, `clinical_notes`, `appointments`, `payments`, `invoices`, `consents`, `audit_log`, `data_requests`.
- Acceso anónimo (web pública) únicamente por: (a) insertar solicitud de cita/contacto vía Route Handler con service role validado (Zod + CAPTCHA + rate limit) y NO por políticas anon directas; (b) leer disponibilidad como vista que expone solo franjas libres, sin ningún dato de paciente.
- La `service_role key` nunca llega al cliente ni a variables `NEXT_PUBLIC_*`; solo en Server Actions/Route Handlers. Escaneo de secretos en CI (gitleaks/GitHub secret scanning).
- Storage: buckets privados (documentos, facturas PDF, consentimientos firmados); políticas por `is_staff()`; acceso solo por URL firmada con caducidad corta (60 s).
- Tests de RLS automatizados (pgTAP o tests con roles `anon`/`authenticated` sin staff): deben demostrar que anon y usuarios no staff no leen nada.
- Migraciones versionadas en `supabase/migrations`, revisadas por PR; sin cambios manuales en producción.

## 4. Cifrado

- En tránsito: TLS 1.2+ forzado, HSTS (2 años, includeSubDomains, preload) en Vercel; Supabase solo conexiones SSL.
- En reposo: cifrado de disco/backups de Supabase (AES-256) como base.
- Cifrado de aplicación para notas clínicas (`clinical_notes.body`) y diagnósticos/campos de ficha especialmente sensibles:
  - Cifrado de sobre (envelope): AES-256-GCM con clave de datos (DEK) por paciente; DEK cifrada con una clave maestra (KEK).
  - KEK fuera de la base de datos: variable de entorno cifrada de Vercel en fase 1; objetivo fase 2: KMS (AWS KMS / GCP KMS) o Supabase Vault. Nunca en el repo.
  - Cifrado/descifrado solo en servidor (Server Actions), nunca en el navegador con la KEK. IV aleatorio de 96 bits por registro, almacenado junto al texto; versión de clave (`key_version`) para rotación.
  - Rotación anual de la KEK y recifrado en lote; procedimiento y prueba documentados.
  - Limitación asumida: lo cifrado no se puede buscar por SQL. Campos para búsqueda (nombre, email) quedan en claro con RLS; las notas clínicas se buscan solo por metadatos (fecha, paciente).
  - Riesgo: perder la KEK = perder las notas. Copia de la KEK en dos sitios offline (sobre sellado / gestor de secretos), probado en el simulacro de restauración.
- Contraseñas: gestionadas por Supabase (bcrypt); no se almacenan en tablas propias.

## 5. Consentimiento informado y bases legales

- Consentimiento informado de tratamiento psicológico (documento clínico): contenido mínimo (encuadre, honorarios, cancelaciones, confidencialidad y sus límites legales, grabaciones no permitidas, modalidad online). Firma manuscrita digital o aceptación con registro; PDF guardado en Storage privado. TODO texto definitivo por la profesional/colegio (COP).
- Consentimiento RGPD separado y granular, NO premarcado, registrado en tabla `consents`: `patient_id`, `purpose` (tratamiento, recordatorios por email/SMS, newsletter, comunicación por WhatsApp), `version_texto`, `given_at`, `ip` (hash), `withdrawn_at`. Retirar es tan fácil como darlo (enlace + panel).
- Menores: <14 años requiere representante legal (LOPDGDD art. 7); 14-17 según madurez y normativa de autonomía del paciente; campo `guardian` y consentimiento de tutores. TODO criterio clínico/legal.
- Formulario público de reserva: casilla obligatoria "he leído la política de privacidad" (información por capas, no consentimiento clínico) y casilla opcional separada para marketing.
- Versionado de textos legales: cada cambio genera versión; se guarda cuál aceptó cada persona.

## 6. Política de privacidad, aviso legal y cookies

- Páginas: `/privacidad`, `/aviso-legal` (LSSI-CE: identidad, NIF, colegiada, contacto), `/cookies`, `/consentimiento-informado` (modelo descargable).
- Política de privacidad por capas (art. 13): responsable, finalidades, bases legales, destinatarios y encargados, transferencias internacionales (Vercel/Supabase EE. UU. con marco UE-EE. UU. DPF + CCT; preferir región UE `eu-central`/`eu-west` en Supabase y Vercel `fra1`), plazos de conservación, derechos y cómo ejercerlos, derecho a reclamar ante la AEPD, existencia o no de decisiones automatizadas (ninguna).
- Cookies: solo técnicas (sesión, CSRF, preferencias) en el panel y la web; sin cookies analíticas ni publicitarias en fase 1 (sin Google Analytics, sin Meta Pixel; son especialmente problemáticos con una web de salud mental). Si se desea analítica: Plausible/Umami autoalojado sin cookies ni IP, y mencionarlo en la política.
  - Si en el futuro hay cookies no técnicas: banner conforme a guía AEPD 2023 (botones "Aceptar" y "Rechazar" al mismo nivel, sin muros, sin casillas premarcadas, configuración granular, revocación sencilla, caducidad de 24 meses).
- Terceros embebidos (Google Maps, YouTube, fuentes de Google): evitar o usar versiones sin seguimiento (OpenStreetMap, youtube-nocookie con consentimiento previo, fuentes autoalojadas con `next/font`).
- Cabeceras de seguridad (next.config / middleware): CSP estricta con nonce, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva, `frame-ancestors 'none'`, `X-Frame-Options: DENY`; `noindex, nofollow` en `/admin` y en `robots.txt`.

## 7. Registro de accesos y auditoría

- Tabla `audit_log` solo de inserción (append-only): `id`, `at`, `actor_id`, `action` (login, login_fallido, mfa_ok, view_patient, view_note, create/update/delete, export, download_doc, consent_change, data_request), `entity`, `entity_id`, `ip` (con hash o recortada), `user_agent`, `result`, `meta jsonb` (sin contenido clínico).
- Políticas RLS: INSERT por funciones de servidor; SELECT solo staff; sin UPDATE ni DELETE (trigger que lo impide). Opcional: encadenar hash de cada fila con la anterior para detectar manipulación.
- Se registra la LECTURA de notas y fichas, no solo las escrituras (requisito típico de historia clínica).
- Alertas: avisos por email ante login desde dispositivo/país nuevo, 5 fallos seguidos, exportaciones masivas, cambios de configuración de 2FA.
- Conservación del log: 2 años (TODO confirmar), revisión mensual de anomalías (checklist en sección 12).
- Los logs de Vercel/Supabase no deben contener datos personales ni clínicos: no usar `console.log` de payloads; redactar emails en logs de error; Sentry (si se usa) con `sendDefaultPii: false`, región UE y scrubbing.

## 8. Conservación, backups y continuidad

- Historia clínica: conservación mínima de 5 años desde el alta (Ley 41/2002, art. 17; las CCAA pueden ampliar). TODO confirmar la norma autonómica de la consulta. Facturas: 6 años (Código de Comercio) / 4 años fiscal. Solicitudes de cita sin continuidad: 12 meses. Logs: ver sección 7.
- Tras el plazo: bloqueo (art. 32 LOPDGDD) y luego destrucción segura; tarea programada que lista candidatos y requiere confirmación manual.
- Backups: Supabase con PITR (plan Pro o superior) y copias diarias; además volcado cifrado semanal (`pg_dump` + `age`/GPG) a almacenamiento UE independiente (otro proveedor) con retención de 8 semanas.
- Objetivos: RPO 24 h (1 h con PITR), RTO 4 h.
- Simulacro de restauración trimestral en un proyecto separado, verificando que las notas descifran con la KEK guardada. Registro del simulacro.
- Los backups también contienen datos personales: cuando se borra a alguien, el dato desaparece de los backups al expirar la retención; informarlo en la política.
- Plan ante pérdida de proveedor: exportación periódica (CSV/JSON cifrado) para poder migrar.

## 9. Derechos ARCO-POL (acceso, rectificación, supresión, oposición, limitación, portabilidad)

- Canal: email dedicado (TODO privacidad@caromafla.online) y formulario `/privacidad/derechos` con verificación de identidad (copia de DNI solo si hay duda razonable, borrado tras la verificación).
- Tabla `data_requests`: tipo, solicitante, fecha de recepción, plazo (1 mes, ampliable 2 meses con motivo), estado, resolución, responsable. Aviso automático al acercarse el vencimiento.
- Acceso/portabilidad: exportación del paciente a JSON + PDF legibles desde el panel, enviada por canal seguro (enlace firmado de caducidad corta + código por otro canal), sin adjuntar datos clínicos por email en abierto. El paciente tiene derecho de acceso a su historia (Ley 41/2002); las anotaciones subjetivas del profesional pueden reservarse (art. 18.3) - decisión clínica/legal.
- Rectificación: edición con histórico de cambios.
- Supresión: no procede mientras rija la obligación legal de conservar la historia clínica; se explica y se aplica bloqueo. Datos no obligatorios (marketing, solicitudes) se eliminan.
- Oposición/limitación: marca `restricted` en el paciente que impide tratamiento no esencial.
- Retirada de consentimiento: efecto inmediato sobre recordatorios y newsletter.

## 10. Seguridad de la aplicación (OWASP)

- Validación de entrada con Zod en cliente y servidor; consultas siempre parametrizadas (cliente Supabase/Prisma), nunca SQL por concatenación.
- Server Actions: comprobar sesión + rol + aal2 en cada una; protección CSRF nativa de Next (Origin) y tokens en formularios públicos.
- Subida de archivos: lista blanca de tipos (PDF, imagen), límite de tamaño, renombrado, antivirus opcional (ClamAV vía función) antes de dejarlo accesible.
- Rate limiting en formularios públicos y en login; honeypot + Turnstile.
- IDOR: ningún acceso por id sin RLS; ids UUID no secuenciales.
- Dependencias: Dependabot/Renovate, `npm audit` en CI, versión de Node LTS, lockfile, revisión de nuevas dependencias.
- Secretos: gestionados en Vercel/Supabase; rotación al cambiar de personal; `.env*` en `.gitignore`; hook pre-commit de gitleaks.
- Entornos separados: dev/preview/prod con proyectos Supabase distintos; NUNCA datos reales en dev/preview (datos sintéticos). Las preview deployments de Vercel protegidas con contraseña.
- Pagos (si hay online): Stripe Checkout alojado (sin tocar tarjetas, SAQ-A); la descripción del cargo no debe revelar el tipo de terapia.
- Videoconsulta (si se ofrece): proveedor con DPA y cifrado (p. ej. Jitsi autoalojado/Whereby/Doxy.me), nunca grabar por defecto; enlaces únicos por cita.
- Correo y SMS: recordatorios con contenido mínimo ("Tienes una cita el X a las Y"), sin motivo ni nombre de la consulta si el asunto puede revelar terapia (decisión por defecto: asunto neutro).
- Dispositivos de la psicóloga: cifrado de disco, bloqueo de pantalla, actualizaciones, sin Wi-Fi público sin VPN. Checklist en sección 12.

## 11. Incidentes y brechas

- Registro de incidentes y procedimiento: detectar, contener (revocar sesiones, rotar claves), evaluar riesgo, notificar a la AEPD en 72 h si hay riesgo para derechos y libertades (art. 33), y comunicar a los afectados si el riesgo es alto (art. 34, probable en datos de salud).
- Plantillas listas de notificación en `docs/plan/anexos/` (TODO crear). Contactos de emergencia (proveedores, abogado/DPO) en un documento fuera del sistema afectado.
- Revisión posterior y lecciones aprendidas por escrito.

## 12. Checklists operativos

Mensual: revisar audit_log y alertas; actualizar dependencias; comprobar backups; revisar usuarios staff.
Trimestral: simulacro de restauración; prueba de RLS en CI con datos sintéticos; revisión de permisos de terceros; borrar solicitudes caducadas.
Anual: rotar KEK y claves API; revisar política de privacidad y EIPD; formación de la psicóloga en seguridad (phishing, 2FA); revisar DPAs y subencargados; auditoría externa ligera/pentest básico.
Antes de lanzar: ver sección 15.

## 13. Documentos RGPD a producir (TODO, a cargo de la profesional con asesoría)

1. Registro de Actividades de Tratamiento (art. 30).
2. EIPD simplificada (art. 35): descripción, necesidad y proporcionalidad, riesgos (acceso indebido, pérdida, reidentificación), medidas (este documento).
3. DPAs con Supabase, Vercel, proveedor de email, pagos, videoconsulta.
4. Política de privacidad, aviso legal, cookies, consentimiento informado, cláusula de formulario web.
5. Procedimiento de ejercicio de derechos y de brechas.
6. Compromiso de confidencialidad de cualquier persona auxiliar con acceso.
7. Evaluar si procede DPO (art. 37: tratamiento a gran escala de categorías especiales; una consulta individual normalmente no, pero confirmarlo).

## 14. Registro de riesgos (lente adversarial)

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|--------------|---------|------------|
| R1 | Tabla creada sin RLS expone pacientes por la API pública | Media | Crítico | Check de CI, RLS forzado, tests con rol anon |
| R2 | Filtración de `service_role` al cliente o al repo | Baja | Crítico | Solo servidor, gitleaks, rotación |
| R3 | Robo de credenciales de la psicóloga | Media | Crítico | 2FA obligatoria, aal2 en RLS, alertas de login |
| R4 | Pérdida de la KEK deja notas ilegibles | Baja | Alto | Doble custodia offline, simulacro de restauración |
| R5 | Datos reales en entornos de preview/dev | Media | Alto | Datos sintéticos, protección de previews |
| R6 | Datos clínicos en logs/Sentry/emails | Media | Alto | Scrubbing, asuntos neutros, revisión de logs |
| R7 | Analítica o terceros que rastrean visitas a web de salud mental | Media | Alto | Sin cookies no técnicas, fuentes y mapas autoalojados |
| R8 | Formulario público usado para spam o enumeración | Alta | Medio | Turnstile, rate limit, respuestas genéricas |
| R9 | Borrado accidental o ransomware | Baja | Alto | PITR + volcado externo cifrado, soft delete |
| R10 | Incumplir plazo de 1 mes en ejercicio de derechos | Media | Medio | Tabla data_requests con alertas |
| R11 | Transferencias a EE. UU. sin garantías | Media | Medio | Regiones UE, DPF/CCT en DPAs |
| R12 | Cifrado de aplicación mal implementado (IV repetido, clave en cliente) | Baja | Alto | Librería probada (Node crypto / libsodium), revisión de código, tests |
| R13 | Confusión menores/representantes legales | Media | Medio | Campo guardian, criterio legal TODO |
| R14 | Ausencia de asesor legal valida textos | Alta | Alto | Revisión legal obligatoria antes de lanzar |

## 15. Criterios de aceptación (puerta de lanzamiento)

- [ ] RLS en el 100 % de tablas, tests anon/no-staff en verde
- [ ] 2FA obligatoria, registro público desactivado
- [ ] Notas clínicas cifradas con envelope, rotación probada
- [ ] audit_log append-only con lecturas registradas
- [ ] CSP y cabeceras activas, `/admin` noindex
- [ ] Sin cookies no técnicas; páginas legales publicadas con datos reales
- [ ] Consentimientos versionados y registrados
- [ ] Backups + restauración probada; KEK custodiada
- [ ] Proceso de derechos y brechas documentado
- [ ] DPAs firmados, regiones UE confirmadas
- [ ] Revisión por abogado/DPO de textos y EIPD
