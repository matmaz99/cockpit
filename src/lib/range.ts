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

/** The instant of 00:00 in Paris on a YYYY-MM-DD (handles DST). From Portail DPE's admin. */
export function parisMidnight(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: PARIS, timeZoneName: 'shortOffset' })
    .formatToParts(guess)
    .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const match = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  const offsetMin = match ? Number(match[1]) * 60 + Math.sign(Number(match[1])) * Number(match[2] ?? 0) : 60;
  return new Date(guess.getTime() - offsetMin * 60_000);
}

/** [from, to) instants of a range: Paris midnight of the first day to Paris midnight after the last. */
export function instants(r: Range): { from: string; to: string } {
  const [y, m, d] = r.to.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { from: parisMidnight(r.from).toISOString(), to: parisMidnight(next).toISOString() };
}
