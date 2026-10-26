import type { Event, Lead } from '../model';
import type { Range } from '../range';

/**
 * What every product adapter provides. Adapters only read; ops (deploys, errors, e-mail)
 * and governance (repo docs) are shared services keyed by the product registry.
 */
export interface ProductAdapter {
  /** False when this deployment has no credential for the product's store. */
  readable(): boolean;
  /** Normalised events of the range (Paris days). */
  events(range: Range): Promise<Event[]>;
  /** Every lead, newest first; callers filter by date. */
  leads(): Promise<Lead[]>;
  /** Paid amounts in the range, when the product sells online. */
  revenue?(range: Range): Promise<{ cents: number; count: number }>;
  /** Dataset versions the product depends on. */
  dataVersions?(): Promise<{ dataset: string; version: string; asOf?: string }[]>;
  /** Tracking installed or not, independent of whether anyone visited. */
  tracking: 'installed' | 'none';
}

/** UTC days that cover a range of Paris days (stores key files by the UTC date). */
export function utcDaysCovering(range: Range): string[] {
  const out = new Set<string>();
  for (const k of range.keys) {
    out.add(k);
    const prev = new Date(`${k}T00:00:00Z`).getTime() - 86_400_000;
    out.add(new Date(prev).toISOString().slice(0, 10));
  }
  return [...out].sort();
}
