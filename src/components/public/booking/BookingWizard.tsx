'use client';
import Link from 'next/link';
import Script from 'next/script';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonLink, Card, Field, Input, Textarea, cn } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { CONSENT_TEXTS } from '@/modules/booking/consent-texts';
import type { BookableService, PublicSlot } from '@/modules/booking/types';
import { MonthCalendar } from './MonthCalendar';

const TZ = 'Europe/Madrid';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const STEPS = ['Servicio', 'Día y hora', 'Tus datos', 'Listo'] as const;
const STORE = 'caromafla.booking.v1';

type Modality = 'in_person' | 'online';
type Errors = Record<string, string>;
type Done = { token: string; startsAt: string };

const euros = (c: number) => (c > 0 ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(c / 100) : 'Consultar');
const dayKey = (iso: string) => formatInTimeZone(new Date(iso), TZ, 'yyyy-MM-dd');
const hour = (iso: string) => formatInTimeZone(new Date(iso), TZ, 'HH:mm');
const longDay = (k: string) => formatInTimeZone(new Date(`${k}T12:00:00Z`), 'UTC', "EEEE d 'de' MMMM", { locale: es });
const nowMonth = () => formatInTimeZone(new Date(), TZ, 'yyyy-MM');
const addMonths = (mk: string, n: number) => {
  const t = new Date(Date.UTC(Number(mk.slice(0, 4)), Number(mk.slice(5, 7)) - 1 + n, 1));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`;
};

export function BookingWizard({
  services,
  initialSlug,
  maxAdvanceDays = 60,
  unavailable,
}: {
  services: BookableService[];
  initialSlug?: string;
  maxAdvanceDays?: number;
  /** true si no hay conexion con la agenda (respaldo local): se ofrece contacto. */
  unavailable?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string>('');
  const [modality, setModality] = useState<Modality>('in_person');
  const [month, setMonth] = useState(nowMonth());
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [alternatives, setAlternatives] = useState<PublicSlot[]>([]);
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const [adult, setAdult] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const service = services.find((s) => s.id === serviceId);
  const modalities: Modality[] = service ? (service.modality === 'both' ? ['in_person', 'online'] : [service.modality]) : [];

  // Preseleccion por ?servicio= y recuperacion de la seleccion (solo servicio/hora; sin datos personales).
  useEffect(() => {
    let sid = services.find((s) => s.slug === initialSlug)?.id ?? '';
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as { serviceId?: string; modality?: Modality } | null;
      if (!sid && saved?.serviceId && services.some((s) => s.id === saved.serviceId)) sid = saved.serviceId;
      if (saved?.modality) setModality(saved.modality);
    } catch {
      /* sessionStorage no disponible */
    }
    if (sid) {
      setServiceId(sid);
      if (services.find((s) => s.id === sid)?.slug === initialSlug) setStep(1);
    }
  }, [services, initialSlug]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ serviceId, modality }));
    } catch {
      /* ignorar */
    }
  }, [serviceId, modality]);

  useEffect(() => {
    if (service && !modalities.includes(modality)) setModality(modalities[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  // Foco al titulo del paso (lectores de pantalla y teclado).
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const loadMonth = useCallback(
    async (mk: string, sid: string, mod: Modality) => {
      if (!sid) return;
      setLoading(true);
      setLoadError('');
      const from = fromZonedTime(`${mk}-01T00:00:00`, TZ);
      const to = fromZonedTime(`${addMonths(mk, 1)}-01T00:00:00`, TZ);
      try {
        const res = await fetch(`/api/booking/slots?service=${sid}&modality=${mod}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
        const json = (await res.json()) as { ok: boolean; slots?: PublicSlot[]; message?: string };
        if (!res.ok || !json.ok) throw new Error(json.message);
        setSlots(json.slots ?? []);
      } catch {
        setSlots([]);
        setLoadError('No he podido cargar las horas libres. Prueba de nuevo o escríbeme desde la página de contacto.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (step === 1 && serviceId) void loadMonth(month, serviceId, modality);
  }, [step, month, serviceId, modality, loadMonth]);

  const available = useMemo(() => new Set(slots.map((s) => dayKey(s.start))), [slots]);
  const daySlots = useMemo(() => (day ? slots.filter((s) => dayKey(s.start) === day) : []), [slots, day]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service || !slot) return;
    setSending(true);
    setErrors({});
    setAlternatives([]);
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? '');
    const payload = {
      serviceId: service.id,
      startsAt: slot,
      modality,
      name: str('name'),
      email: str('email'),
      phone: str('phone'),
      adult,
      guardian: adult ? undefined : { name: str('g-name'), relationship: str('g-rel'), email: str('g-email'), phone: str('g-phone') },
      note: str('note'),
      consentPrivacy: fd.get('consentPrivacy') === 'on',
      consentHealth: fd.get('consentHealth') === 'on',
      consentReminders: fd.get('consentReminders') === 'on',
      website: str('website'),
      turnstileToken: str('cf-turnstile-response'),
    };
    try {
      const res = await fetch('/api/booking', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string; startsAt?: string; message?: string; code?: string; errors?: Errors; alternatives?: PublicSlot[] };
      if (res.ok && json.ok && json.token) {
        setDone({ token: json.token, startsAt: json.startsAt ?? slot });
        setStep(3);
        try {
          sessionStorage.removeItem(STORE);
        } catch {
          /* ignorar */
        }
        return;
      }
      if (json.code === 'slot_taken') {
        setAlternatives(json.alternatives ?? []);
        setNotice(json.message ?? 'Ese hueco acaba de ocuparse.');
        setSlot(null);
        setStep(1);
        void loadMonth(month, service.id, modality);
      } else {
        setErrors({ ...(json.errors ?? {}), form: json.errors ? 'Revisa los campos marcados.' : (json.message ?? 'No se ha podido enviar. Inténtalo de nuevo.') });
      }
    } catch {
      setErrors({ form: 'No se ha podido enviar. Revisa tu conexión e inténtalo de nuevo.' });
    } finally {
      setSending(false);
    }
  }

  if (unavailable) {
    return (
      <Card className="max-w-2xl">
        <h2 className="font-serif text-2xl">La agenda online no está disponible ahora mismo</h2>
        <p className="mt-3 text-ink-soft">Puedes pedirme cita desde la página de contacto y te respondo en menos de 24 horas laborables.</p>
        <div className="mt-6"><ButtonLink href="/contacto">Escribirme</ButtonLink></div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol aria-label="Progreso de la reserva" className="mb-10 flex gap-2">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined} className="flex-1">
            <div className={cn('h-1.5 rounded-full transition-colors duration-300', i <= step ? 'bg-primary' : 'bg-sand')} />
            <span className={cn('mt-2 block text-sm', i === step ? 'font-medium text-ink' : 'text-ink-soft')}>
              <span className="sr-only">Paso {i + 1}: </span>
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{i === step ? label : ''}</span>
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Reveal immediate key="s0">
          <h2 ref={heading} tabIndex={-1} className="font-serif text-3xl outline-none md:text-4xl">¿Qué te gustaría reservar?</h2>
          <p className="mt-3 text-ink-soft">Si es tu primera vez, la primera sesión sirve para conocernos, sin compromiso.</p>
          <fieldset className="mt-8">
            <legend className="sr-only">Servicio</legend>
            <div className="flex flex-col gap-3">
              {services.map((s) => (
                <label
                  key={s.id}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-start gap-4 rounded-lg border bg-white p-5 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                    serviceId === s.id ? 'border-primary bg-surface' : 'border-sand hover:border-ink-soft/50',
                  )}
                >
                  <input type="radio" name="service" value={s.id} checked={serviceId === s.id} onChange={() => setServiceId(s.id)} className="mt-1.5 size-5 accent-[#5f7a64]" />
                  <span className="flex-1">
                    <span className="block font-serif text-xl">{s.name}</span>
                    {s.description ? <span className="mt-1 block text-ink-soft">{s.description}</span> : null}
                    <span className="mt-2 block text-sm text-ink-soft">
                      {s.durationMin} min · {s.modality === 'both' ? 'Presencial u online' : s.modality === 'online' ? 'Online' : 'Presencial'} · {euros(s.priceCents)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-8"><Button size="lg" disabled={!serviceId} onClick={() => setStep(1)}>Continuar</Button></div>
        </Reveal>
      )}

      {step === 1 && service && (
        <Reveal immediate key="s1">
          <h2 ref={heading} tabIndex={-1} className="font-serif text-3xl outline-none md:text-4xl">Elige día y hora</h2>
          <p className="mt-3 text-ink-soft">{service.name} · {service.durationMin} min. Horas en horario de Madrid.</p>
          {modalities.length > 1 && (
            <fieldset className="mt-6">
              <legend className="mb-2 text-sm font-medium">Modalidad</legend>
              <div className="flex gap-3">
                {modalities.map((m) => (
                  <label key={m} className={cn('flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary', modality === m ? 'border-primary bg-surface' : 'border-sand')}>
                    <input type="radio" name="modality" className="sr-only" checked={modality === m} onChange={() => { setModality(m); setDay(null); setSlot(null); }} />
                    {m === 'online' ? 'Online' : 'Presencial'}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {notice ? <p role="alert" className="mt-6 rounded-lg bg-surface p-4">{notice}</p> : null}
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_14rem]">
            <MonthCalendar
              month={month}
              onMonthChange={(mk) => { setMonth(mk); setDay(null); setSlot(null); }}
              available={available}
              selected={day}
              onSelect={(d) => { setDay(d); setSlot(null); }}
              loading={loading}
              minMonth={nowMonth()}
              maxMonth={addMonths(nowMonth(), Math.ceil(maxAdvanceDays / 30))}
            />
            <div aria-live="polite">
              {loadError ? <p role="alert" className="text-danger">{loadError}</p> : null}
              {day ? (
                <>
                  <h3 className="mb-3 font-medium capitalize">{longDay(day)}</h3>
                  <ul className="grid grid-cols-3 gap-2 md:grid-cols-2">
                    {daySlots.map((s) => (
                      <li key={s.start}>
                        <button
                          type="button"
                          aria-pressed={slot === s.start}
                          onClick={() => setSlot(s.start)}
                          className={cn('min-h-11 w-full rounded-full border px-3 tabular-nums transition-colors duration-150', slot === s.start ? 'border-primary bg-primary text-primary-ink' : 'border-sand bg-white hover:bg-surface')}
                        >
                          {hour(s.start)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-ink-soft">{!loading && !loadError && available.size === 0 ? 'No hay horas libres este mes. Prueba con el siguiente o escríbeme.' : 'Elige un día para ver las horas libres.'}</p>
              )}
              {!loading && !loadError && available.size === 0 ? (
                <p className="mt-4 text-sm"><Link href="/contacto" className="underline underline-offset-4">No encuentro hueco, quiero que me avises</Link></p>
              ) : null}
            </div>
          </div>
          {alternatives.length > 0 && (
            <div className="mt-6 rounded-lg bg-surface p-4">
              <p className="font-medium">Otras horas libres</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {alternatives.map((s) => (
                  <li key={s.start}>
                    <button type="button" onClick={() => { setSlots((xs) => (xs.some((x) => x.start === s.start) ? xs : [...xs, s])); setSlot(s.start); setStep(2); }} className="min-h-11 rounded-full border border-sand bg-white px-4">
                      {longDay(dayKey(s.start))}, {hour(s.start)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-8 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(0)}>Atrás</Button>
            <Button size="lg" disabled={!slot} onClick={() => setStep(2)}>Continuar</Button>
          </div>
        </Reveal>
      )}

      {step === 2 && service && (
        <Reveal immediate key="s2">
          <h2 ref={heading} tabIndex={-1} className="font-serif text-3xl outline-none md:text-4xl">Tus datos de contacto</h2>
          <p className="mt-3 text-ink-soft">
            {service.name}{slot ? ` · ${longDay(dayKey(slot))}, ${hour(slot)}` : ''}{' '}
            <button type="button" onClick={() => setStep(1)} className="underline underline-offset-4">cambiar</button>
          </p>
          <form ref={form} onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
              <label>No rellenar<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <Field id="b-name" label="Nombre y apellidos" error={errors.name}>
              <Input id="b-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'b-name-error' : undefined} />
            </Field>
            <Field id="b-email" label="Correo electrónico" hint="Aquí recibirás la confirmación." error={errors.email}>
              <Input id="b-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'b-email-error' : 'b-email-hint'} />
            </Field>
            <Field id="b-phone" label="Teléfono (opcional)" error={errors.phone}>
              <Input id="b-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} />
            </Field>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium">Edad</legend>
              <label className="flex min-h-11 items-center gap-3"><input type="radio" name="adult" checked={adult} onChange={() => setAdult(true)} className="size-5 accent-[#5f7a64]" />Tengo 18 años o más</label>
              <label className="flex min-h-11 items-center gap-3"><input type="radio" name="adult" checked={!adult} onChange={() => setAdult(false)} className="size-5 accent-[#5f7a64]" />Soy menor de 18 años</label>
            </fieldset>
            {!adult && (
              <div className="flex flex-col gap-4 rounded-lg bg-surface p-5">
                <p className="text-sm text-ink-soft">Para atender a una persona menor necesito los datos y el consentimiento de su padre, madre o tutor/a legal. TODO_REAL: edad mínima de atención.</p>
                <Field id="g-name" label="Nombre de la persona tutora" error={errors['guardian.name'] ?? errors.guardian}><Input id="g-name" name="g-name" autoComplete="off" /></Field>
                <Field id="g-rel" label="Relación (madre, padre, tutor/a legal)" error={errors['guardian.relationship']}><Input id="g-rel" name="g-rel" /></Field>
                <Field id="g-email" label="Correo de la persona tutora" error={errors['guardian.email']}><Input id="g-email" name="g-email" type="email" /></Field>
                <Field id="g-phone" label="Teléfono de la persona tutora (opcional)"><Input id="g-phone" name="g-phone" type="tel" /></Field>
              </div>
            )}

            <Field id="b-note" label="Nota para mí (opcional)" hint="Máximo 500 caracteres. No escribas aquí datos de salud ni el motivo de consulta: lo hablaremos en la sesión." error={errors.note}>
              <Textarea id="b-note" name="note" rows={3} maxLength={500} aria-describedby="b-note-hint" />
            </Field>

            <fieldset className="flex flex-col gap-3 rounded-lg border border-sand bg-white p-5">
              <legend className="px-2 text-sm font-medium">Consentimientos</legend>
              <Consent name="consentPrivacy" error={errors.consentPrivacy} required>
                {CONSENT_TEXTS.privacy} <Link href="/privacidad" target="_blank" className="underline underline-offset-4">Leer la política</Link>
              </Consent>
              <Consent name="consentHealth" error={errors.consentHealth} required>{CONSENT_TEXTS.health}</Consent>
              <Consent name="consentReminders">{CONSENT_TEXTS.reminders}</Consent>
            </fieldset>

            {SITE_KEY ? <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="light" /> : null}
            <div aria-live="assertive">{errors.form ? <p role="alert" className="text-danger">{errors.form}</p> : null}</div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
              <Button type="submit" size="lg" disabled={sending || !slot}>{sending ? 'Enviando…' : 'Solicitar cita'}</Button>
            </div>
            {SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" /> : null}
          </form>
        </Reveal>
      )}

      {step === 3 && done && (
        <div role="status">
          <motion.svg viewBox="0 0 64 64" className="size-20 text-primary" fill="none" aria-hidden="true" initial="hidden" animate="shown">
            <motion.circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { duration: 0.7 } } }} />
            <motion.path d="M19 33l9 9 17-19" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { duration: 0.5, delay: 0.5 } } }} />
          </motion.svg>
          <h2 ref={heading} tabIndex={-1} className="mt-6 font-serif text-3xl outline-none md:text-4xl">He recibido tu solicitud</h2>
          <p className="mt-4 text-lg">{service?.name} · <span className="capitalize">{longDay(dayKey(done.startsAt))}</span>, {hour(done.startsAt)} (hora de Madrid).</p>
          <p className="mt-3 text-ink-soft">Te he enviado un correo con los detalles y un archivo de calendario. Revisaré la solicitud y te confirmaré la cita. Si no lo ves, mira en spam.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/reservar/confirmacion/${done.token}`}>Ver o cancelar mi cita</ButtonLink>
            <ButtonLink href={`/api/booking/ics?token=${done.token}`} variant="secondary">Añadir al calendario</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

function Consent({ name, children, error, required }: { name: string; children: React.ReactNode; error?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" name={name} aria-required={required} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} className="mt-0.5 size-5 shrink-0 accent-[#5f7a64]" />
        <span>{children}{required ? ' (obligatorio)' : ''}</span>
      </label>
      {error ? <p id={`${name}-error`} role="alert" className="pl-8 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
