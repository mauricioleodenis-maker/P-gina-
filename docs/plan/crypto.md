# Cifrado de notas clinicas (P2)

Implementacion: `src/lib/crypto/index.ts` (solo servidor, `import 'server-only'`). Decisiones: PLAN.md C7, C8, C9.

## Esquema
- AES-256-GCM, nonce aleatorio de 12 B, tag de 16 B. Columna `bytea`: `nonce || ciphertext || tag` (`session_notes.body_enc`, `session_note_versions.body_enc`) + `key_version smallint`.
- Clave maestra: `CLINICAL_ENCRYPTION_KEY` (32 B base64, `openssl rand -base64 32`), version vigente `CLINICAL_KEY_VERSION`.
- Clave por paciente: `HKDF-SHA256(master, salt="caromafla/clinical/v<ver>", info="patient:<patient_id>")`.
- AAD = `patient_id`: copiar un blob a otro paciente (o filas barajadas) falla al descifrar.
- La BD, los backups y el panel de Supabase solo ven bytes. RLS (aal2) es la segunda barrera.

## API
```ts
encryptNote(plain, { patientId }) -> { bodyEnc: Buffer, keyVersion: number }
decryptNote(bodyEnc /*Buffer|Uint8Array|"\\x.." hex*/, keyVersion, { patientId }) -> string
reencryptNote(bodyEnc, keyVersion, { patientId }) -> EncryptedNote | null   // null si ya es la vigente
toPgBytea(buf) / fromPgBytea(hex)   // PostgREST envia/recibe bytea como "\\x<hex>"
```
Guardar con supabase-js: `body_enc: toPgBytea(bodyEnc), key_version: keyVersion`. Leer: `decryptNote(row.body_enc, row.key_version, {patientId})`.
Errores: `CryptoConfigError` (clave/version mal configurada), `DecryptError` (datos alterados, paciente o clave incorrectos). Nunca registrar plaintext, claves ni `body_enc` en logs, audit `meta`, Sentry ni emails.

## Rotacion de claves
1. Generar nueva clave: `openssl rand -base64 32`.
2. En Vercel: mover la actual a `CLINICAL_ENCRYPTION_KEY_V<n>` (n = version actual), poner la nueva en `CLINICAL_ENCRYPTION_KEY` y subir `CLINICAL_KEY_VERSION` a n+1. Desplegar: las notas nuevas usan n+1; las antiguas siguen descifrandose con su `key_version`.
3. Migrar en lote (script/accion admin, fuera de P2): para cada fila con `key_version < vigente`: `reencryptNote(...)` y `update ... set body_enc, key_version`, en transaccion y por tandas; auditar con `logAudit`. Incluir `session_note_versions`.
4. Cuando `select count(*) from session_notes where key_version < vigente` sea 0 en notas y versiones (y los backups PITR antiguos hayan caducado), se puede retirar `CLINICAL_ENCRYPTION_KEY_V<n>`.
Compromiso de clave: rotar de inmediato (pasos 1-3) y evaluar brecha RGPD art. 33/34 (plazo 72 h).

## Perdida de clave (riesgo principal)
Sin la clave las notas son IRRECUPERABLES. Obligatorio antes de produccion (TODO_REAL profesional): copia offline cifrada de la clave y de cada `_V<n>` (gestor de contrasenas + sobre fisico), en dos ubicaciones distintas; prueba de restauracion trimestral descifrando una nota sintetica en staging. Las claves nunca van al repo ni a Supabase; staging y prod usan claves distintas.

## Alta del admin
Crear usuario en Supabase Auth (signups desactivados), enrolar TOTP, y como service_role/SQL editor: `insert into public.profiles (id, role, full_name) values ('<auth.users.id>', 'admin', '<nombre>');`. `is_admin()` exige rol admin y `aal2` en el JWT.

## Pruebas
- Unit: `npx vitest run src/lib/crypto`.
- SQL (Postgres 16 temporal, sin Supabase CLI): `bash supabase/tests/run.sh` — RLS en todas las tablas, anon/aal1/assistant sin acceso, solape, doble reserva, numeracion sin huecos (y concurrente), inmutabilidad de facturas, audit_log append-only, reembolsos, seed.
- v2: Supabase Vault/KMS con sobre DEK/KEK (C8).
