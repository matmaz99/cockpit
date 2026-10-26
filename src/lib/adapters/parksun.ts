import 'server-only';
import type { Event, EventType, Lead, Source } from '../model';
import { parisDay, type Range } from '../range';
import { isTestEmail, normaliseRole, tierOf } from '../roles';
import { blobReadable, listPaths, pool, readJson, type BlobSource } from '../sources/blob';
import { utcDaysCovering, type ProductAdapter } from './types';

/**
 * Parksun: Next.js app writing to the private Blob store parksun-analytics
 * (src/lib/analytics/store.ts in matmaz99/Sunpark):
 *   ev/YYYY-MM-DD/<ms>-<rand>.json   one batch (array) of events per /api/track call
 *   day/YYYY-MM-DD.json              a past day merged by Parksun's own admin
 *   lead/<id>.json                   one lead per file
 * Both day layouts are read and nothing is written, so Parksun's merge-on-read keeps
 * working and a part that disappears mid-read is simply skipped.
 */

interface RawEvent { t: number; e: string; v: string; s: string; p: string; d?: Record<string, unknown>; c?: string; ci?: string; dev?: 'mobile' | 'tablet' | 'desktop'; br?: string; ref?: string; utm?: string }
interface RawLead {
  id: string; createdAt: number; email: string; role: string; company?: string; parking?: string; query?: string; areaM2?: number; visitor?: string;
  contact?: { at: number; phone?: string; horizon: string; pref: string; decider: boolean; consent: boolean };
}

function typeOf(e: RawEvent): EventType {
  switch (e.e) {
    case 'pageview': return e.p === '/rapport' ? 'result' : 'pageview';
    case 'simulate': return 'simulation';
    case 'report_open': return 'result';
    case 'lead_report': return 'lead';
    case 'lead_contact': return 'contact';
    case 'quote_pay': return 'payment';
    default: return 'other';
  }
}

/** Parking area tiers, from the loi APER thresholds (1 500 and 10 000 m²). */
const TIERS: [number, number, number] = [1_500, 5_000, 10_000];

export function parksunAdapter(blob: BlobSource): ProductAdapter {
  return {
    tracking: 'installed',
    readable: () => blobReadable(blob),

    async events(range: Range) {
      const keep = new Set(range.keys);
      const perDay = await pool(utcDaysCovering(range), 4, async (d) => {
        const [merged, parts] = await Promise.all([readJson<RawEvent[]>(blob, `day/${d}.json`), listPaths(blob, `ev/${d}/`)]);
        const loaded = await pool(parts, 16, (p) => readJson<RawEvent[]>(blob, p));
        return [...(merged ?? []), ...loaded.flatMap((x) => x ?? [])];
      });
      const raw = perDay.flat().filter((e) => e && keep.has(parisDay(e.t))).sort((a, b) => a.t - b.t);

      // Parksun keeps the source per session, on the session's first event.
      const firstOfSession = new Map<string, Source>();
      for (const e of raw) {
        if (firstOfSession.has(e.s)) continue;
        firstOfSession.set(e.s, { kind: 'session', referrer: e.ref || undefined, utmSource: e.utm || undefined, landing: e.p });
      }
      return raw.map((e): Event => ({
        product: 'parksun', at: e.t, rawType: e.e, type: typeOf(e), visitor: e.v, session: e.s, path: e.p,
        source: firstOfSession.get(e.s), device: e.dev, props: e.d,
      }));
    },

    async leads() {
      const paths = await listPaths(blob, 'lead/');
      const raws = await pool(paths, 16, (p) => readJson<RawLead>(blob, p));
      return raws
        .filter((r): r is RawLead => !!r && !!r.email && !isTestEmail(r.email))
        .map((r): Lead => ({
          product: 'parksun', id: r.id, at: r.createdAt, email: r.email,
          role: normaliseRole(r.role), rawRole: r.role,
          sizeTier: tierOf(r.areaM2, TIERS),
          hasPhone: !!r.contact?.phone, consent: !!r.contact?.consent,
          building: r.parking || r.query ? { id: r.parking, label: r.query } : undefined,
          // Leads go to the team inbox (LEAD_TO); there is no partner routing and the lead
          // file records no send status, so nothing beyond "new" can be claimed here.
          delivery: { status: 'new' },
        }))
        .sort((a, b) => b.at - a.at);
    },
  };
}
