import 'server-only';
import type { Event, EventType, Lead, Source } from '../model';
import { parisDay, type Range } from '../range';
import { isTestEmail, normaliseRole, tierOf } from '../roles';
import { blobReadable, listPaths, pool, readJson, type BlobSource } from '../sources/blob';
import { utcDaysCovering, type ProductAdapter } from './types';

/**
 * Cadastre tertiaire and DPE immeuble: static HTML sites whose api/track.js and
 * api/lead.js write one private Blob file per event and per lead:
 *   events/YYYY-MM-DD/<event>-<base36 time><rand4>.json  {event, props, at, visitor, session, source, page, ua}
 *   leads/YYYY-MM-DD/<id>.json  {id, at, email, role, company, building, query, visitor, session, source, ip, ua}
 * The date in the path is the UTC date of `at`. `source` is the visitor's first touch.
 */

interface RawSource { ref?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; landing?: string }
interface RawEvent { event?: string; props?: Record<string, unknown>; at?: string; visitor?: string; session?: string; source?: RawSource | null; page?: string; ua?: string }
interface RawLead {
  id: string; at: string; email: string; role?: string; company?: string; query?: string; visitor?: string; session?: string; source?: RawSource | null;
  building?: { id?: string; address?: string; floor?: number; act?: string; subject?: boolean; lots?: number } | null;
}

const TYPES: Record<string, EventType> = { pageview: 'pageview', simulation: 'simulation', result: 'result', report_request: 'lead' };

const source = (s: RawSource | null | undefined): Source | undefined => {
  if (!s) return undefined;
  const host = (() => { try { return s.ref ? new URL(s.ref).hostname.replace(/^www\./, '') : undefined; } catch { return s.ref || undefined; } })();
  return { kind: 'first-touch', referrer: host, utmSource: s.utm_source || undefined, utmMedium: s.utm_medium || undefined, utmCampaign: s.utm_campaign || undefined, landing: s.landing || undefined };
};

const device = (ua?: string): Event['device'] => (!ua ? undefined : /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop');

/** Floor area tiers for buildings: under 1 000 m² is outside the décret tertiaire. */
const TIERS: [number, number, number] = [1_000, 3_000, 10_000];

export function staticSiteAdapter(product: Event['product'], blob: BlobSource, tracking: ProductAdapter['tracking']): ProductAdapter {
  return {
    tracking,
    readable: () => blobReadable(blob),

    async events(range: Range) {
      const keep = new Set(range.keys);
      const paths = (await pool(utcDaysCovering(range), 6, (d) => listPaths(blob, `events/${d}/`))).flat();
      const raws = await pool(paths, 16, (p) => readJson<RawEvent>(blob, p));
      const out: Event[] = [];
      raws.forEach((r, i) => {
        if (!r) return;
        const rawType = r.event || paths[i].split('/').pop()!.split('-')[0];
        const at = Date.parse(r.at ?? '') || 0;
        if (!at || !keep.has(parisDay(at))) return;
        out.push({
          product, at, rawType, type: TYPES[rawType] ?? 'other',
          visitor: r.visitor || 'anon', session: r.session, path: r.page, source: source(r.source), device: device(r.ua), props: r.props,
        });
      });
      return out.sort((a, b) => a.at - b.at);
    },

    async leads() {
      const paths = await listPaths(blob, 'leads/');
      const raws = await pool(paths, 16, (p) => readJson<RawLead>(blob, p));
      return raws
        .filter((r): r is RawLead => !!r && !!r.email && !isTestEmail(r.email))
        .map((r): Lead => ({
          product, id: r.id, at: Date.parse(r.at) || 0, email: r.email,
          role: normaliseRole(r.role), rawRole: r.role || undefined,
          sizeTier: tierOf(r.building?.floor, TIERS),
          hasPhone: false, consent: false,
          building: r.building ? { id: r.building.id, address: r.building.address, label: r.building.act } : r.query ? { label: r.query } : undefined,
          source: source(r.source),
          // No e-mail is sent by these sites yet: every lead is new until the sender exists.
          delivery: { status: 'new' },
        }))
        .sort((a, b) => b.at - a.at);
    },
  };
}
