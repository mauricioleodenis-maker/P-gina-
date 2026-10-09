-- seed.sql - SOLO desarrollo/staging. Datos 100 % FICTICIOS. NUNCA ejecutar en produccion.
-- No incluye notas clinicas (van cifradas desde la app) ni usuario admin (alta manual, ver docs/plan/crypto.md).
do $$ begin
  if current_setting('app.allow_seed', true) = 'false' then raise exception 'seed bloqueado'; end if;
end $$;

-- Horario base TODO_REAL: lun-vie 10-14 y 16-20 (editable en /admin/ajustes)
insert into public.availability_rules (weekday, start_time, end_time, modality)
select d, t.s, t.e, 'both'
from generate_series(1,5) d,
     (values ('10:00'::time,'14:00'::time), ('16:00'::time,'20:00'::time)) as t(s,e)
where not exists (select 1 from public.availability_rules);

insert into public.patients (id, full_name, email, phone, birth_date, status, modality, consent_data, consent_data_at, tags)
values
 ('00000000-0000-4000-8000-000000000001','Lucia Ejemplo Garcia','lucia.ejemplo@example.test','600000001','1990-04-12','active','in_person',true,now(),'{ansiedad}'),
 ('00000000-0000-4000-8000-000000000002','Mateo Prueba Lopez','mateo.prueba@example.test','600000002','1985-11-03','active','online',true,now(),'{}'),
 ('00000000-0000-4000-8000-000000000003','Jose Maria Nunez (Ejemplo)','jm.nunez@example.test','600000003','1978-01-25','paused','in_person',true,now(),'{pareja}'),
 ('00000000-0000-4000-8000-000000000004','Carmen Ficticia Ruiz','carmen.ficticia@example.test','600000004','1995-07-30','discharged','online',true,now(),'{}'),
 ('00000000-0000-4000-8000-000000000005','Hugo Menor Ejemplo','tutor.hugo@example.test','600000005','2012-09-09','active','in_person',true,now(),'{infanto-juvenil}')
on conflict (id) do nothing;

update public.patients set guardian = '{"name":"Tutora Ejemplo","relationship":"madre","email":"tutora@example.test","phone":"600000099"}'::jsonb
 where id = '00000000-0000-4000-8000-000000000005' and guardian is null;

-- Citas: semana pasada (completadas), proximas (programadas) y una solicitud pendiente. Horas fijas, sin solapes.
do $$
declare
  s_ind uuid; s_first uuid; base date := (now() at time zone 'Europe/Madrid')::date;
  p1 uuid := '00000000-0000-4000-8000-000000000001'; p2 uuid := '00000000-0000-4000-8000-000000000002';
  p5 uuid := '00000000-0000-4000-8000-000000000005'; pay uuid;
begin
  if exists (select 1 from public.appointments) then return; end if;
  select id into s_ind from public.services where slug='terapia-individual';
  select id into s_first from public.services where slug='primera-sesion';

  insert into public.appointments(patient_id, service_id, starts_at, ends_at, status, price_cents) values
   (p1, s_ind, ((base - 14) + time '10:00') at time zone 'Europe/Madrid', ((base - 14) + time '10:50') at time zone 'Europe/Madrid', 'completed', 6000),
   (p1, s_ind, ((base -  7) + time '10:00') at time zone 'Europe/Madrid', ((base -  7) + time '10:50') at time zone 'Europe/Madrid', 'completed', 6000),
   (p2, s_ind, ((base -  6) + time '17:00') at time zone 'Europe/Madrid', ((base -  6) + time '17:50') at time zone 'Europe/Madrid', 'no_show',   6000),
   (p1, s_ind, ((base +  7) + time '10:00') at time zone 'Europe/Madrid', ((base +  7) + time '10:50') at time zone 'Europe/Madrid', 'scheduled', 6000),
   (p5, s_ind, ((base +  3) + time '16:00') at time zone 'Europe/Madrid', ((base +  3) + time '16:50') at time zone 'Europe/Madrid', 'confirmed', 6000);

  insert into public.appointments(service_id, starts_at, ends_at, status, price_cents, requester_name, requester_email, requester_phone)
  values (s_first, ((base + 5) + time '12:00') at time zone 'Europe/Madrid', ((base + 5) + time '13:00') at time zone 'Europe/Madrid',
          'requested', 0, 'Solicitante Ejemplo', 'solicitante@example.test', '600000010');

  insert into public.payments(patient_id, appointment_id, service_id, amount_cents, method, status, paid_at)
  select a.patient_id, a.id, a.service_id, 6000, 'cash', 'paid', a.ends_at from public.appointments a where a.status='completed';
  insert into public.payments(patient_id, service_id, amount_cents, method, status)
  values (p2, s_ind, 6000, 'bizum', 'pending');

  insert into public.contact_messages(name,email,message,consent)
  values ('Persona Ejemplo','persona@example.test','Hola, quisiera informacion sobre las tarifas (mensaje ficticio).',true);
  insert into public.data_requests(requester_name, requester_email, type, patient_id)
  values ('Lucia Ejemplo Garcia','lucia.ejemplo@example.test','access','00000000-0000-4000-8000-000000000001');
end $$;
