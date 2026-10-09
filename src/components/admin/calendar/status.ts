import type { AppointmentStatus } from '@/types/database';

/** Clases por estado. El estado tambien se escribe en texto (no solo color). */
export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  requested: 'border-warn bg-warn/15 text-[#6f4a0f]',
  scheduled: 'border-primary bg-primary/15 text-primary-strong',
  confirmed: 'border-ok bg-ok/20 text-[#2c5c40]',
  completed: 'border-sand bg-surface text-ink-soft',
  no_show: 'border-danger bg-danger/10 text-danger',
  cancelled: 'border-dashed border-ink-soft/40 bg-transparent text-ink-soft line-through',
};
