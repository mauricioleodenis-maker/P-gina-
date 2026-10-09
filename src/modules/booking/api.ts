// Contrato fijo (PLAN s.9). Implementa P5. Consume appointments/api (P7) y, al aceptar, patients/api (P6).
export { submitBooking, sendBookingEmails, getPublicSlots, getBookingByToken, cancelByToken } from './service';
export type { BookingResult } from './service';
export type * from './types';
