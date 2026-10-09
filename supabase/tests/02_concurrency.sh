#!/usr/bin/env bash
# Numeracion de facturas sin huecos bajo concurrencia: 20 emisiones en paralelo -> 1..20 sin repetir.
# Uso: PGURL=postgres://... bash supabase/tests/02_concurrency.sh  (BD ya migrada y con 01_policies pasado o limpia)
set -euo pipefail
: "${PGURL:?define PGURL}"
P=psql; Q=(-X -q -t -A -v ON_ERROR_STOP=1 "$PGURL")
$P "${Q[@]}" <<'SQL'
insert into auth.users(id) values ('44444444-4444-4444-4444-444444444444') on conflict do nothing;
insert into public.profiles(id,role) values ('44444444-4444-4444-4444-444444444444','admin') on conflict do nothing;
insert into public.patients(id,full_name) values ('bbbbbbbb-0000-0000-0000-000000000001','Concurrencia') on conflict do nothing;
SQL
for i in $(seq 1 20); do
  $P "${Q[@]}" -c "begin; set local role authenticated; select set_config('request.jwt.claims','{\"sub\":\"44444444-4444-4444-4444-444444444444\",\"aal\":\"aal2\"}',true); select public.issue_invoice('bbbbbbbb-0000-0000-0000-000000000001','c',100,0,'{}','C'); commit;" >/dev/null &
done
wait
res=$($P "${Q[@]}" -c "select count(*)||':'||count(distinct seq_no)||':'||min(seq_no)||':'||max(seq_no) from public.invoices where series='C'")
[ "$res" = "20:20:1:20" ] && echo "ok  - numeracion concurrente sin huecos ($res)" || { echo "FAIL concurrencia: $res"; exit 1; }
