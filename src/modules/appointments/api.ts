// Contrato fijo (PLAN s.9). Implementa P7. `getAvailability` es publica (service_role);
// el resto usa la sesion del admin y la RLS. Llamar solo tras `requireAdmin()` desde actions/paginas.
import 'server-only';
export type { Slot } from './types';
export {
  getAvailability,
  createAppointment,
  listAppointments,
  acceptRequest,
  rejectRequest,
  markCompleted,
} from './service';
