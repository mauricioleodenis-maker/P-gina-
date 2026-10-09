#!/usr/bin/env bash
# Levanta un Postgres temporal (binarios de PG16), aplica shim + 0001_init.sql + seed y ejecuta los tests.
# Uso: bash supabase/tests/run.sh      (PG_BIN=/usr/lib/postgresql/16/bin por defecto)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
DIR="$(mktemp -d)"; PORT="${PGPORT_TEST:-54329}"
RUNAS=(); if [ "$(id -u)" = 0 ]; then id pgtest >/dev/null 2>&1 || useradd -m pgtest; chown pgtest "$DIR"; RUNAS=(su pgtest -c); fi
run() { if [ ${#RUNAS[@]} -gt 0 ]; then "${RUNAS[@]}" "$*"; else bash -c "$*"; fi; }
cleanup() { run "$PG_BIN/pg_ctl -D $DIR/data stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
run "$PG_BIN/initdb -D $DIR/data -U postgres --auth=trust" >/dev/null
run "$PG_BIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR -c listen_addresses=' -l $DIR/log -w start" >/dev/null
URL="postgresql://postgres@/postgres?host=$DIR&port=$PORT"
psql_() { psql -X -q -v ON_ERROR_STOP=1 "$URL" "$@"; }
psql_ -f "$HERE/00_shim.sql"
psql_ -f "$ROOT/migrations/0001_init.sql"
psql_ -f "$HERE/01_policies.test.sql" >"$DIR/out" 2>&1 || { cat "$DIR/out"; echo "TESTS SQL FALLARON"; exit 1; }
sed -E 's/^psql:[^ ]+ NOTICE:  //' "$DIR/out" | grep -E "^ok  -|PASSED"
PGURL="$URL" bash "$HERE/02_concurrency.sh"
# seed (datos ficticios) sobre BD limpia: debe aplicar sin errores
psql_ -c "truncate public.patients cascade" >/dev/null 2>&1 || true
psql_ -f "$ROOT/seed.sql" >/dev/null && echo "ok  - seed.sql aplica"
echo "TODO OK"
