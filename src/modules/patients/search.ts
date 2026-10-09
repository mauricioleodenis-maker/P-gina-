/** Normaliza para buscar sin acentos ni mayusculas ("Jose" encuentra "José"). */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchesQuery(fields: Array<string | null | undefined>, q: string): boolean {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = normalize(fields.filter(Boolean).join(' '));
  return terms.every((t) => hay.includes(t));
}

/** Edad en anios cumplidos a una fecha dada (YYYY-MM-DD). */
export function ageOn(birthDate: string | null, today: Date = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  let age = today.getUTCFullYear() - y;
  const before = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (before) age -= 1;
  return age;
}

export const isMinor = (birthDate: string | null, today?: Date) => {
  const a = ageOn(birthDate, today);
  return a !== null && a < 18;
};
