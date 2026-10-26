import type { Count, DayRow, Event, EventType, FunnelStep, Lead, TrafficSummary } from './model';
import { parisDay, type Range } from './range';
import { ROLE_LABELS } from './roles';

/**
 * Traffic and funnel from normalised events. Generalised from Parksun's
 * src/lib/admin/stats.ts (top/bump, nested funnel); product-specific tables stay out.
 */

type Bag = Map<string, { n: number; v: Set<string> }>;
const bag = (): Bag => new Map();
function bump(m: Bag, key: string | undefined | null, v: string) {
  if (!key) return;
  const x = m.get(key) ?? { n: 0, v: new Set<string>() };
  x.n++;
  x.v.add(v);
  m.set(key, x);
}
const top = (m: Bag, k = 12): Count[] =>
  [...m].map(([key, x]) => ({ key, n: x.n, visitors: x.v.size })).sort((a, b) => b.n - a.n).slice(0, k);

const pct = (now: number, before: number) => (before ? Math.round((100 * (now - before)) / before) : null);

export function traffic(events: Event[], leads: Lead[], range: Range): TrafficSummary {
  const byDay = new Map<string, { v: Set<string>; pv: number; sim: number; leads: number }>();
  for (const k of range.keys) byDay.set(k, { v: new Set(), pv: 0, sim: 0, leads: 0 });
  const visitors = new Set<string>();
  const sources = bag(), utm = bag(), pages = bag();
  const sourceSeen = new Set<string>();
  let pageviews = 0;

  for (const e of events) {
    const d = byDay.get(parisDay(e.at));
    if (!d) continue;
    d.v.add(e.visitor);
    visitors.add(e.visitor);
    if (e.type === 'pageview' || (e.type === 'result' && e.rawType === 'pageview')) { pageviews++; d.pv++; bump(pages, e.path, e.visitor); }
    if (e.type === 'simulation') d.sim++;
    // One source per visitor (first touch) or per session (Parksun).
    const sk = e.source?.kind === 'session' ? `s:${e.session}` : `v:${e.visitor}`;
    if (!sourceSeen.has(sk)) {
      sourceSeen.add(sk);
      bump(sources, e.source?.referrer || (e.source ? 'Accès direct' : 'Inconnu'), e.visitor);
      if (e.source?.utmSource) bump(utm, [e.source.utmSource, e.source.utmMedium, e.source.utmCampaign].filter(Boolean).join(' / '), e.visitor);
    }
  }
  for (const l of leads) { const d = byDay.get(parisDay(l.at)); if (d) d.leads++; }

  const days: DayRow[] = [...byDay].map(([day, x]) => ({ day, visitors: x.v.size, pageviews: x.pv, simulations: x.sim, leads: x.leads }));
  // Week over week on the last 14 days of the range (needs a range of 14 days or more).
  const last = days.slice(-7), prev = days.slice(-14, -7);
  const sum = (rows: DayRow[], k: 'visitors' | 'leads') => rows.reduce((a, r) => a + r[k], 0);
  const wow = prev.length === 7
    ? { visitors: pct(sum(last, 'visitors'), sum(prev, 'visitors')), leads: pct(sum(last, 'leads'), sum(prev, 'leads')) }
    : { visitors: null, leads: null };

  return { days, visitors: visitors.size, pageviews, sources: top(sources), utm: top(utm), pages: top(pages), wow };
}

const STEPS: { key: EventType; label: string }[] = [
  { key: 'pageview', label: 'Visiteurs' },
  { key: 'simulation', label: 'Ont simulé' },
  { key: 'result', label: 'Ont vu un résultat' },
  { key: 'lead', label: 'Ont laissé un e-mail' },
  { key: 'contact', label: 'Ont demandé un contact' },
];

/**
 * Visitors reaching each step, each step nested in the previous one (as in Parksun's admin):
 * a visitor counts at "result" only if they also simulated. Any event counts as a visit.
 * Steps a product never emits (no "contact" on the static sites) are dropped.
 */
export function funnel(events: Event[], emitted: EventType[] = STEPS.map((s) => s.key)): FunnelStep[] {
  const by = new Map<EventType, Set<string>>();
  const all = new Set<string>();
  for (const e of events) {
    all.add(e.visitor);
    if (!by.has(e.type)) by.set(e.type, new Set());
    by.get(e.type)!.add(e.visitor);
  }
  by.set('pageview', all);
  const steps = STEPS.filter((s) => emitted.includes(s.key));
  let prev: Set<string> | null = null;
  return steps.map((s): FunnelStep => {
    const here = by.get(s.key) ?? new Set<string>();
    const nested: Set<string> = prev ? new Set([...here].filter((v) => prev!.has(v))) : here;
    const step: FunnelStep = { key: s.key, label: s.label, visitors: nested.size };
    if (prev) {
      step.rate = prev.size ? Math.round((1000 * nested.size) / prev.size) / 10 : 0;
      step.dropOff = prev.size - nested.size;
    }
    prev = nested;
    return step;
  });
}

export function leadSummary(leads: Lead[], range: Range) {
  const inRange = leads.filter((l) => range.keys.includes(parisDay(l.at)));
  const week = new Set(range.keys.slice(-7));
  const count = (f: (l: Lead) => string): Count[] => {
    const m = new Map<string, number>();
    for (const l of inRange) m.set(f(l), (m.get(f(l)) ?? 0) + 1);
    return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
  };
  return {
    total: inRange.length,
    last7: leads.filter((l) => week.has(parisDay(l.at))).length,
    byRole: count((l) => ROLE_LABELS[l.role]),
    byTier: count((l) => (l.sizeTier === 'unknown' ? 'Inconnue' : l.sizeTier)),
    recent: inRange.slice(0, 20),
    revenueCents: inRange.reduce((a, l) => a + (l.revenueCents ?? 0), 0),
  };
}
