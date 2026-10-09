# Checklist de puerta de lanzamiento (P10)

Ver `docs/plan/06-seguridad-rgpd.md` s.15. Marcar solo con evidencia.

## Legal (bloqueante)
- [ ] Textos `src/content/legal/*` revisados por abogado/DPO; retirar la marca `REVISAR_CON_ABOGADO` y subir `version`.
- [ ] Todos los `TODO_REAL` de `site.ts` y legales sustituidos (titular, NIF, colegiada, domicilio, email).
- [ ] DPAs firmados: Supabase, Vercel, Resend, Upstash, Cloudflare (Turnstile).
- [ ] RAT y EIPD simplificada completados (`eipd-simplificada.md`, `rat.md`).
- [ ] Plazo autonomico de conservacion de historia clinica confirmado.
- [ ] Criterio de edad minima / menores definido.

## Tecnico
- [ ] CI verde: lint, tipos, tests, build, gitleaks, tests SQL (RLS).
- [ ] `CRON_SECRET` definido en Vercel (reminders 17:00 UTC, materialize 03:00 UTC).
- [ ] Turnstile (site + secret) y Upstash configurados en produccion (el rate limit permite todo sin ellos).
- [ ] Supabase prod en region UE con PITR; MFA obligatorio; registro publico deshabilitado; HIBP activo.
- [ ] Simulacro de restauracion y prueba de descifrado con la clave guardada.
- [ ] Cabeceras verificadas (securityheaders.com) y CSP sin violaciones en consola.
- [ ] Lighthouse movil 90/95/95; axe sin graves; LCP<2,5 s, CLS<0,1.
- [ ] `NEXT_PUBLIC_ANALYTICS_ENABLED=false` salvo decision explicita (si true: banner + politica de cookies actualizada).
- [ ] DNS: SPF, DKIM, DMARC del dominio de email.
