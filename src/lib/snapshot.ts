import 'server-only';
import { unstable_cache } from 'next/cache';
import { adapterFor } from './adapters';
import type { Summary } from './adapters/types';
import type { Event, EventType, Lead, ProductId, ProductSnapshot } from './model';
import { parisDay, rangeOf } from './range';
import { funnel, leadSummary, traffic } from './stats';

/**
 * One product's numbers for a period. Live reads for now, cached 10 minutes per product
 * and period; on day 4 the hourly job writes these to the cockpit's own store and pages
 * read the stored copy instead.
 */
async function build(id: ProductId, days: number): Promise<ProductSnapshot> {
  const a = adapterFor(id);
  const warnings: string[] = [];
  // Read at least two weeks so the week-over-week comparison always has its baseline.
  const wide = rangeOf(Math.max(days, 14));
  const shown = rangeOf(days);
  let events: Event[] = [];
  let leads: Lead[] = [];
  let summary: Summary | null = null;
  let wideSummary: Summary | null = null;

  if (!a.readable()) warnings.push('Source de données non branchée sur ce déploiement.');
  else {
    try {
      if (a.summary) [summary, wideSummary, leads] = await Promise.all([a.summary(shown), days >= 14 ? null : a.summary(wide), a.leads()]);
      else [events, leads] = await Promise.all([a.events(wide), a.leads()]);
    } catch (e) { warnings.push(`Lecture impossible : ${(e as Error).message}`); }
  }
  if (a.tracking === 'none') warnings.push('Suivi non installé sur le site.');
  else if (a.readable() && !a.summary && !warnings.length && events.length === 0) warnings.push('Aucun événement reçu sur les 14 derniers jours : vérifier le suivi du site.');
  if (summary) {
    warnings.push(...summary.notes);
    const wd = (wideSummary ?? summary).days;
    const sum = (rows: typeof wd, k: 'visitors' | 'leads') => rows.reduce((x, r) => x + r[k], 0);
    const pctOf = (now: number, before: number) => (before ? Math.round((100 * (now - before)) / before) : null);
    const last = wd.slice(-7), prev = wd.slice(-14, -7);
    return {
      product: id, generatedAt: Date.now(), rangeDays: days,
      traffic: {
        days: summary.days, visitors: summary.visitors, pageviews: summary.pageviews, sources: summary.sources, utm: summary.utm, pages: summary.pages,
        wow: prev.length === 7 ? { visitors: pctOf(sum(last, 'visitors'), sum(prev, 'visitors')), leads: pctOf(sum(last, 'leads'), sum(prev, 'leads')) } : { visitors: null, leads: null },
      },
      funnel: summary.funnel,
      leads: { ...leadSummary(leads, shown), revenueCents: summary.revenueCents },
      ops: emptyOps('live'),
      governance: { gates: [], weekly: [], next: [], source: 'none' },
      health: { level: 'unknown', reasons: ['Santé calculée à partir du jour 5.'] },
      warnings,
    };
  }

  const keep = new Set(shown.keys);
  const inShown = events.filter((e) => keep.has(parisDay(e.at)));
  const emitted = new Set(events.map((e) => e.type));
  const steps: EventType[] = ['pageview', 'simulation', 'result', 'lead', ...(emitted.has('contact') ? (['contact'] as const) : [])];

  return {
    product: id,
    generatedAt: Date.now(),
    rangeDays: days,
    traffic: { ...traffic(inShown, leads, shown), wow: traffic(events, leads, wide).wow },
    funnel: funnel(inShown, steps),
    leads: leadSummary(leads, shown),
    ops: emptyOps(a.tracking === 'none' ? 'none' : events.length ? 'live' : 'no-data'),
    governance: { gates: [], weekly: [], next: [], source: 'none' },
    health: { level: 'unknown', reasons: ['Santé calculée à partir du jour 5.'] },
    warnings,
  };
}

const emptyOps = (tracking: ProductSnapshot['ops']['tracking']): ProductSnapshot['ops'] => ({ deploy: null, domains: [], email: null, errors24h: [], data: [], tracking });

export const snapshot = (id: ProductId, days: number) =>
  unstable_cache(() => build(id, days), ['snapshot', id, String(days)], { revalidate: 600, tags: [`snap:${id}`] })();
