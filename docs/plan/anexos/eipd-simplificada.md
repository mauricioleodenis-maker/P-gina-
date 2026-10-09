# EIPD simplificada (borrador, REVISAR_CON_ABOGADO)

Tratamiento: gestion de consulta de psicologia (citas, historia clinica, facturacion). Responsable: TODO_REAL.

| Aspecto | Descripcion |
|---|---|
| Necesidad y proporcionalidad | Asistencia sanitaria (art. 9.2.h). Formularios publicos sin datos clinicos; minimizacion. |
| Datos especiales | Salud (notas de sesion), cifradas con AES-256-GCM, clave por paciente (HKDF) y AAD. |
| Riesgos | Acceso no autorizado; perdida de clave; exfiltracion por proveedor; fuga por email/logs; doble reserva; incumplimiento de plazos de derechos. |
| Medidas | RLS forzada + `aal2`; MFA; auditoria append-only con lecturas; sin datos clinicos en logs/emails; backups PITR y volcado cifrado; separacion de entornos; rate limit + Turnstile; CSP/HSTS. |
| Riesgo residual | TODO_REAL: valorar con asesor (probabilidad x impacto). |
| Consulta previa AEPD | TODO_REAL: decidir si procede segun riesgo residual. |
| Revision | Anual o ante cambios relevantes. |
