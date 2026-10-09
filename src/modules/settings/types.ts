import type {
  AuditLogRow,
  AvailabilityExceptionRow,
  AvailabilityRuleRow,
  PracticeSettingsRow,
  ServiceRow,
} from '@/types/database';

export type { AuditLogRow, AvailabilityExceptionRow, AvailabilityRuleRow, PracticeSettingsRow, ServiceRow };
export type { ActionResult, FormState } from '@/modules/auth/types';

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'] as const;
/** Orden de presentacion: lunes a domingo (weekday de BD: 0 = domingo). */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const MODALITY_LABEL = { in_person: 'Presencial', online: 'Online', both: 'Ambas' } as const;
