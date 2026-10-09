-- Tests SQL de RLS, solape, numeracion, audit y privilegios. Cada fallo lanza excepcion.
\set ON_ERROR_STOP on
\set admin  '11111111-1111-1111-1111-111111111111'
\set staff  '22222222-2222-2222-2222-222222222222'
\set other  '33333333-3333-3333-3333-333333333333'

-- fixtures (como superusuario)
insert into auth.users(id,email) values (:'admin','admin@t'),(:'staff','staff@t'),(:'other','other@t');
insert into public.profiles(id,role,full_name) values (:'admin','admin','Admin'),(:'staff','assistant','Asist');
insert into public.patients(id,full_name,email,phone) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Paciente Prueba','p@t.test','600000000');
insert into public.session_notes(patient_id,body_enc) values
  ('aaaaaaaa-0000-0000-0000-000000000001','\xdeadbeef');
insert into public.contact_messages(name,email,message,consent) values ('n','e@t.test','m',true);

create or replace function pg_temp.expect_count(p_sql text, p_expected int, p_label text) returns void
language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  if n <> p_expected then raise exception 'FAIL [%]: esperado %, obtenido %', p_label, p_expected, n; end if;
  raise notice 'ok  - %', p_label;
end $$;
create or replace function pg_temp.expect_error(p_sql text, p_label text) returns void
language plpgsql as $$
begin
  begin execute p_sql; exception when others then raise notice 'ok  - % (%)', p_label, sqlerrm; return; end;
  raise exception 'FAIL [%]: debia fallar', p_label;
end $$;
grant execute on function pg_temp.expect_count(text,int,text), pg_temp.expect_error(text,text) to public;

-- 1) RLS activada en TODAS las tablas de public (una tabla sin RLS hace fallar el test)
do $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
           where n.nspname='public' and c.relkind='r' and not c.relrowsecurity loop
    raise exception 'FAIL: tabla public.% sin RLS', t;
  end loop;
  raise notice 'ok  - todas las tablas tienen RLS';
end $$;

-- tablas clinicas y de negocio con FORCE
do $$
declare t text;
begin
  for t in select unnest(array['patients','appointments','appointment_series','session_notes',
      'session_note_versions','payments','invoices','consents','audit_log']) loop
    if not (select relforcerowsecurity from pg_class where oid=('public.'||t)::regclass) then
      raise exception 'FAIL: public.% sin FORCE RLS', t; end if;
  end loop;
  raise notice 'ok  - FORCE RLS en tablas clinicas';
end $$;

-- 2) anon no lee nada salvo servicios activos
set role anon;
select pg_temp.expect_error('select * from public.patients', 'anon no lee patients (privilegio)');
select pg_temp.expect_error('select * from public.session_notes', 'anon no lee session_notes');
select pg_temp.expect_error('select * from public.appointments', 'anon no lee appointments');
select pg_temp.expect_error('select * from public.contact_messages', 'anon no lee contact_messages');
select pg_temp.expect_error($$insert into public.contact_messages(name,email,message,consent) values ('a','a@a.aa','m',true)$$, 'anon no inserta contacto');
select pg_temp.expect_error('select * from public.practice_settings', 'anon no lee practice_settings');
select pg_temp.expect_error($$select public.request_appointment(null,now(),'a','a@a.aa',null,null,true,true,false,null,null,'h','h','v1')$$, 'anon no ejecuta request_appointment');
select pg_temp.expect_error($$select * from public.busy_slots(now(), now() + interval '1 day')$$, 'anon no ejecuta busy_slots');
select pg_temp.expect_error('select * from public.v_income_monthly', 'anon no lee v_income_monthly');
select pg_temp.expect_count('select * from public.services', 3, 'anon lee servicios activos');
reset role;

-- 3) aal1 (sin MFA) no lee nada clinico, ni siendo admin
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal1"}', :'admin'), false);
select pg_temp.expect_count('select * from public.patients', 0, 'admin aal1 no lee patients');
select pg_temp.expect_count('select * from public.session_notes', 0, 'admin aal1 no lee session_notes');
select pg_temp.expect_count('select * from public.contact_messages', 0, 'admin aal1 no lee contactos');
select pg_temp.expect_count('select * from public.practice_settings', 0, 'admin aal1 no lee ajustes');
select pg_temp.expect_count($$select * from public.profiles where id = auth.uid()$$, 1, 'aal1 lee su propio perfil (middleware)');
select pg_temp.expect_count('select * from public.profiles', 1, 'aal1 solo ve su perfil');
select pg_temp.expect_error($$insert into public.patients(full_name) values ('x')$$, 'admin aal1 no inserta patients');
reset role;

-- 4) usuario no admin (assistant / sin perfil) aal2 no lee nada
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'staff'), false);
select pg_temp.expect_count('select * from public.patients', 0, 'assistant aal2 no lee patients');
select pg_temp.expect_count('select * from public.session_notes', 0, 'assistant aal2 no lee notas');
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'other'), false);
select pg_temp.expect_count('select * from public.patients', 0, 'usuario sin perfil no lee patients');
select pg_temp.expect_count('select * from public.profiles', 0, 'usuario sin perfil no ve perfiles');
-- no puede auto-promocionarse
select pg_temp.expect_error($$insert into public.profiles(id,role) values ('33333333-3333-3333-3333-333333333333','admin')$$, 'no auto-alta como admin');
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'staff'), false);
do $$ declare n int; begin
  update public.profiles set role='admin' where id = auth.uid(); get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: assistant se promociono'; end if; raise notice 'ok  - assistant no se promociona';
end $$;
reset role;

-- 5) admin aal2 lee y escribe
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'admin'), false);
select pg_temp.expect_count('select * from public.patients', 1, 'admin aal2 lee patients');
select pg_temp.expect_count('select * from public.session_notes', 1, 'admin aal2 lee notas');
select pg_temp.expect_count('select * from public.contact_messages', 1, 'admin aal2 lee contactos');
select pg_temp.expect_count('select * from public.practice_settings', 1, 'admin aal2 lee ajustes');
select pg_temp.expect_error($$insert into public.contact_messages(name,email,message,consent) values ('a','a@a.aa','m',false)$$, 'contacto sin consentimiento rechazado');
select pg_temp.expect_error($$select public.request_appointment(null,now(),'a','a@a.aa',null,null,true,true,false,null,null,'h','h','v1')$$, 'admin no ejecuta request_appointment (solo service_role)');
select pg_temp.expect_error($$select * from public.busy_slots(now(), now() + interval '1 day')$$, 'admin no ejecuta busy_slots');
select pg_temp.expect_error($$update public.invoice_counters set last_number = 0$$, 'contador de facturas no modificable directamente');
reset role;

-- 6) solape de citas rechazado (incluye completed/no_show); cancelada libera el hueco
do $$
declare s uuid; t timestamptz := date_trunc('hour', now()) + interval '10 days';
begin
  select id into s from public.services limit 1;
  insert into public.appointments(service_id,patient_id,starts_at,ends_at,status)
    values (s,'aaaaaaaa-0000-0000-0000-000000000001',t,t+interval '50 minutes','completed');
  begin
    insert into public.appointments(service_id,patient_id,starts_at,ends_at,status)
      values (s,'aaaaaaaa-0000-0000-0000-000000000001',t+interval '30 minutes',t+interval '80 minutes','scheduled');
    raise exception 'FAIL: solape aceptado';
  exception when exclusion_violation then raise notice 'ok  - solape rechazado'; end;
  -- adyacente permitido
  insert into public.appointments(service_id,patient_id,starts_at,ends_at,status)
    values (s,'aaaaaaaa-0000-0000-0000-000000000001',t+interval '50 minutes',t+interval '100 minutes','scheduled');
  raise notice 'ok  - cita adyacente permitida';
  update public.appointments set status='cancelled' where starts_at=t;
  insert into public.appointments(service_id,patient_id,starts_at,ends_at,status)
    values (s,'aaaaaaaa-0000-0000-0000-000000000001',t,t+interval '50 minutes','scheduled');
  raise notice 'ok  - cancelar libera el hueco';
end $$;

-- 7) request_appointment (service_role): crea solicitud + consentimientos; doble reserva rechazada
set role service_role;
do $$
declare s uuid; t timestamptz := date_trunc('hour', now()) + interval '20 days'; id1 uuid; n int;
begin
  select id into s from public.services where slug='terapia-individual';
  id1 := public.request_appointment(s,t,'Ana','ana@t.test','600',null,true,true,true,'nota',null,'hash1','iph','v1');
  select count(*) into n from public.consents where appointment_id=id1;
  if n <> 3 then raise exception 'FAIL: consents=% (esperado 3)', n; end if;
  raise notice 'ok  - solicitud crea cita + 3 consentimientos';
  begin
    perform public.request_appointment(s,t,'Beto','b@t.test',null,null,true,true,false,null,null,'hash2','iph','v1');
    raise exception 'FAIL: doble reserva aceptada';
  exception when exclusion_violation then raise notice 'ok  - doble reserva rechazada'; end;
  begin perform public.request_appointment(s,t+interval '3 hours','C','c@t.test',null,null,false,true,false,null,null,'h3','iph','v1');
    raise exception 'FAIL'; exception when raise_exception then if sqlerrm <> 'consent_required' then raise; end if; raise notice 'ok  - sin consentimiento rechazado'; end;
  begin perform public.request_appointment(s,now()+interval '1 hour','C','c@t.test',null,null,true,true,false,null,null,'h3','iph','v1');
    raise exception 'FAIL'; exception when raise_exception then if sqlerrm <> 'too_soon' then raise; end if; raise notice 'ok  - antelacion minima'; end;
  begin perform public.request_appointment(s,t+interval '3 hours','C','no-es-email',null,null,true,true,false,null,null,'h3','iph','v1');
    raise exception 'FAIL'; exception when raise_exception then if sqlerrm <> 'invalid_email' then raise; end if; raise notice 'ok  - email invalido'; end;
  select count(*) into n from public.busy_slots(t - interval '1 day', t + interval '1 day');
  if n < 1 then raise exception 'FAIL: busy_slots vacio'; end if;
  raise notice 'ok  - busy_slots devuelve rangos';
end $$;
reset role;

-- 8) facturacion: correlativa, inmutable, rectificativa
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'admin'), false);
do $$
declare i1 uuid; i2 uuid; r uuid; n1 text; n2 text; nr text; pid uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
begin
  i1 := public.issue_invoice(pid,'Sesion',6000,0);
  i2 := public.issue_invoice(pid,'Sesion',6000,0);
  select number into n1 from public.invoices where id=i1;
  select number into n2 from public.invoices where id=i2;
  if n1 !~ '^F-[0-9]{4}-0001$' or n2 !~ '^F-[0-9]{4}-0002$' then raise exception 'FAIL numeracion % %', n1, n2; end if;
  raise notice 'ok  - numeracion correlativa % %', n1, n2;
  -- un rollback no deja hueco
  begin
    perform public.issue_invoice(pid,'Sesion',6000,0);
    raise exception 'forzar_rollback';
  exception when raise_exception then null; end;
  r := public.issue_invoice(pid,'Sesion',6000,0);
  if (select seq_no from public.invoices where id=r) <> 3 then raise exception 'FAIL: hueco tras rollback'; end if;
  raise notice 'ok  - rollback no deja hueco';
  begin update public.invoices set total_cents=1 where id=i1; raise exception 'FAIL: factura mutable';
  exception when raise_exception then if sqlerrm <> 'invoice_immutable' then raise; end if; raise notice 'ok  - factura emitida inmutable'; end;
  begin delete from public.invoices where id=i1; raise exception 'FAIL: factura borrable';
  exception when raise_exception then if sqlerrm <> 'invoice_not_deletable' then raise; end if; raise notice 'ok  - factura emitida no borrable'; end;
  r := public.issue_invoice(pid,'Rectifica '||n1,6000,0,'{}','R',i1);
  select number into nr from public.invoices where id = r;
  if nr is null or nr !~ '^R-[0-9]{4}-0001$' then raise exception 'FAIL serie R: %', nr; end if;
  raise notice 'ok  - rectificativa serie R %', nr;
  update public.invoices set status='void' where id=i1;
  raise notice 'ok  - anulacion permitida';
end $$;
reset role;

-- aal1 no emite facturas
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal1"}', :'admin'), false);
select pg_temp.expect_error($$select public.issue_invoice('aaaaaaaa-0000-0000-0000-000000000001','x',100,0)$$, 'aal1 no emite facturas');
reset role;

-- 9) audit_log inmutable (incluso para superusuario, via trigger) y por privilegios
do $$
begin
  if (select count(*) from public.audit_log) < 1 then raise exception 'FAIL: audit_trigger no registra'; end if;
  begin update public.audit_log set action='x'; raise exception 'FAIL: audit update';
  exception when raise_exception then if sqlerrm not like '%append-only%' then raise; end if; end;
  begin delete from public.audit_log; raise exception 'FAIL: audit delete';
  exception when raise_exception then if sqlerrm not like '%append-only%' then raise; end if; end;
  begin truncate public.audit_log; raise exception 'FAIL: audit truncate';
  exception when raise_exception then if sqlerrm not like '%append-only%' then raise; end if; end;
  raise notice 'ok  - audit_log append-only (trigger)';
  if exists (select 1 from public.audit_log where meta::text ilike '%deadbeef%') then raise exception 'FAIL: audit con contenido'; end if;
end $$;
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":"%s","aal":"aal2"}', :'admin'), false);
select pg_temp.expect_error($$update public.audit_log set action='x'$$, 'admin no actualiza audit_log');
select pg_temp.expect_error($$delete from public.audit_log$$, 'admin no borra audit_log');
select pg_temp.expect_count($$select * from public.audit_log$$, (select count(*)::int from public.audit_log), 'admin lee audit_log');
reset role;

-- 10) vista de ingresos: reembolso resta
do $$
declare pid uuid := 'aaaaaaaa-0000-0000-0000-000000000001'; p1 uuid; inc bigint;
begin
  insert into public.payments(patient_id,amount_cents,status,paid_at) values (pid,6000,'paid',now()) returning id into p1;
  insert into public.payments(patient_id,amount_cents,status,paid_at,refund_of) values (pid,1000,'refunded',now(),p1);
  select sum(income_cents) into inc from public.v_income_monthly;
  if inc <> 5000 then raise exception 'FAIL ingresos=%', inc; end if;
  raise notice 'ok  - reembolso resta en v_income_monthly';
  begin insert into public.payments(patient_id,amount_cents,status,paid_at) values (pid,1000,'refunded',now());
    raise exception 'FAIL'; exception when check_violation then raise notice 'ok  - reembolso exige refund_of'; end;
end $$;

-- 11) busqueda sin acentos
do $$ begin
  if public.f_unaccent('Mª José Pérez') <> 'Mª Jose Perez' then raise exception 'FAIL unaccent'; end if;
  raise notice 'ok  - f_unaccent';
end $$;

\echo ALL SQL TESTS PASSED
