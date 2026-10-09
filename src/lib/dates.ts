import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

export const TZ = 'Europe/Madrid';

export const toMadrid = (d: Date) => toZonedTime(d, TZ);
export const fromMadrid = (d: Date) => fromZonedTime(d, TZ);
export const formatMadrid = (d: Date, pattern = 'dd/MM/yyyy HH:mm') =>
  formatInTimeZone(d, TZ, pattern);
