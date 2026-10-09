import type { DataRequestItem } from './types';

export const DAY_MS = 86_400_000;

/** Variacion porcentual redondeada; null si no hay base de comparacion. */
export function variationPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Estado de plazo de una solicitud RGPD (plazo legal 1 mes). */
export function requestUrgency(
  status: string,
  dueAt: string,
  now: Date = new Date(),
): { daysLeft: number | null; urgency: DataRequestItem['urgency'] } {
  if (status === 'resolved' || status === 'rejected') return { daysLeft: null, urgency: 'closed' };
  const daysLeft = Math.ceil((new Date(dueAt).getTime() - now.getTime()) / DAY_MS);
  if (daysLeft < 0) return { daysLeft, urgency: 'overdue' };
  if (daysLeft <= 7) return { daysLeft, urgency: 'soon' };
  return { daysLeft, urgency: 'ok' };
}
