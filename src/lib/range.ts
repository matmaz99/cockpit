/**
 * Paris days. Same definitions as Portail DPE's admin (src/lib/admin/analytics.ts) so the
 * cockpit and that admin count the same day boundaries.
 */

const PARIS = 'Europe/Paris';
const DAY = 86_400_000;

/** YYYY-MM-DD of an instant in Paris. */
export function parisDay(d: Date | number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PARIS, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
}

/** The last `days` Paris days, oldest first, today included. */
export function lastDays(days: number, now = Date.now()): string[] {
  const out = new Set<string>();
  // Step by 12 h so DST changes never skip or repeat a day.
  for (let t = now; out.size < days; t -= DAY / 2) out.add(parisDay(t));
  return [...out].reverse();
}

export interface Range { days: number; keys: string[]; from: string; to: string }

export function rangeOf(days: number, now = Date.now()): Range {
  const keys = lastDays(days, now);
  return { days, keys, from: keys[0], to: keys[keys.length - 1] };
}

export const parseDays = (v: string | undefined) => ([7, 30, 90].includes(Number(v)) ? Number(v) : 7);
