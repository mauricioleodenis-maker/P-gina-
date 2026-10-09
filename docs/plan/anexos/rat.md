# Registro de actividades de tratamiento (borrador, REVISAR_CON_ABOGADO)

| Actividad | Finalidad | Base legal | Datos | Conservacion | Encargados |
|---|---|---|---|---|---|
| Contacto web | Responder consultas | 6.1.a | nombre, email, telefono, mensaje | 12 meses sin continuidad | Supabase, Vercel, Upstash, Turnstile |
| Solicitud de cita | Gestionar citas | 6.1.b | identificativos, servicio, horario | 12 meses sin continuidad | Supabase, Vercel, Resend |
| Historia clinica | Asistencia sanitaria | 9.2.h, 6.1.c | identificativos, salud, consentimientos | >=5 anios desde alta (TODO CCAA) | Supabase (cifrado app) |
| Facturacion | Obligaciones fiscales | 6.1.c | fiscales, importes | 6 anios | Supabase, gestoria TODO_REAL |
| Derechos RGPD | Atender solicitudes | 6.1.c | nombre, email, tipo de derecho | 2 anios (acreditacion) | Supabase |
| Auditoria de seguridad | Seguridad/trazabilidad | 6.1.f | accion, tabla, hash de IP | 2 anios | Supabase |

Responsable: TODO_REAL (nombre, NIF, contacto).
