import { createEvent } from 'ics';
import { site } from '@/config/site';

export type IcsInput = {
  uid: string;
  startsAt: Date;
  endsAt: Date;
  summary: string;
  modality: 'in_person' | 'online';
};

/** .ics sin datos clinicos: titulo neutro. Devuelve null si falla. */
export function buildIcs({ uid, startsAt, endsAt, summary, modality }: IcsInput): string | null {
  const toArr = (d: Date) =>
    [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()] as [number, number, number, number, number];
  const { error, value } = createEvent({
    uid: `${uid}@${site.domain}`,
    title: summary,
    start: toArr(startsAt),
    startInputType: 'utc',
    startOutputType: 'utc',
    end: toArr(endsAt),
    endInputType: 'utc',
    endOutputType: 'utc',
    location: modality === 'online' ? 'Videollamada (enlace por email)' : site.contact.address,
    description: `Cita en ${site.name}. Para cambios, usa el enlace de tu correo o escribe a ${site.contact.email}.`,
    status: 'TENTATIVE',
    productId: site.domain,
    calName: site.name,
    alarms: [{ action: 'display', description: 'Recordatorio de cita', trigger: { hours: 24, before: true } }],
  });
  return error || !value ? null : value;
}
