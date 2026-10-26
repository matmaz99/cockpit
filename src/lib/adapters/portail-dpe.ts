import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Count, DayRow, DeliveryStatus, FunnelStep, Lead, Role } from '../model';
import { instants, rangeOf, type Range } from '../range';
import { tierOf } from '../roles';
import type { ProductAdapter, Summary } from './types';

/**
 * Portail DPE: Supabase project "mondpe". Counting happens in Postgres through the
 * functions its own admin uses (migrations/012_admin_analytics.sql in matmaz99/mondpe:
 * admin_kpis, admin_daily, admin_funnel, admin_breakdown), so both screens agree to the
 * row. Read with the service key, server-side only; the cockpit never writes.
 *
 * Definitions inherited from that admin: a "visitor" here is a person who checked a DPE
 * (dpe_check; page views are not stored), a "lead" is a distinct e-mail, test addresses
 * (admin_is_test_email) are excluded.
 */

// Mirrors admin_is_test_email (migrations/013_free_bilan.sql).
const isTest = (e: string) => /mazz|test|example\.com|@tinkso\.com$/i.test(e);

interface DailyRow { day: string; checks: number; checkers: number; leads: number; checkouts: number; purchases: number; revenue_cents: number }
interface Kpis { checks: number; checkers: number; leads: number; checkouts: number; purchases: number; revenue_cents: number }
interface FunnelRow { checkers: number; leads: number; checkouts: number; buyers: number }
interface BreakdownRow { key: string | null; checkers: number | null; leads: number; buyers: number; revenue_cents: number }
interface LeadRow {
  id: string; email: string; created_at: string; intent: string | null; segment: string | null; lead_type: string | null; source: string | null;
  phone: string | null; marketing_consent: boolean | null; surface: number | null; address: string | null; postal_code: string | null;
  dpe_number: string | null; current_label: string | null; report_generated_at: string | null; visitor_id: string | null;
}
interface DispatchRow { lead_id: string; status: string; sent_at: string | null; price_cents: number | null; paid_at: string | null }

function roleOf(r: LeadRow): Role {
  if (r.segment === 'pro' || r.intent === 'pro') return 'pro';
  if (['sell', 'rent', 'landlord', 'renovate'].includes(r.intent ?? '')) return 'owner';
  if (['buy', 'curious', 'other'].includes(r.intent ?? '')) return 'individual';
  return 'unknown';
}

const DISPATCH: Record<string, DeliveryStatus> = { proposed: 'dispatched', sent: 'dispatched', accepted: 'accepted', rejected: 'rejected', invoiced: 'accepted', paid: 'accepted' };

/** Home surface tiers (m²). */
const TIERS: [number, number, number] = [50, 100, 200];

const n = (x: unknown) => Number(x ?? 0) || 0;
const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : 0);

export function portailDpeAdapter(url: string | undefined, key: string | undefined): ProductAdapter {
  let db: SupabaseClient | null = null;
  const client = () => (db ??= createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } }));
  const rpc = async <T>(fn: string, args: Record<string, unknown>): Promise<T> => {
    const { data, error } = await client().rpc(fn, args);
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  };

  return {
    tracking: 'installed',
    readable: () => !!url && !!key,
    events: async () => [],

    async summary(range: Range): Promise<Summary> {
      const { from, to } = instants(range);
      const args = { p_from: from, p_to: to };
      const [kpis, daily, f, ref, utm] = await Promise.all([
        rpc<Kpis>('admin_kpis', args),
        rpc<DailyRow[]>('admin_daily', args),
        rpc<FunnelRow>('admin_funnel', { ...args, p_segment: null }),
        rpc<BreakdownRow[]>('admin_breakdown', { ...args, p_dim: 'referrer' }),
        rpc<BreakdownRow[]>('admin_breakdown', { ...args, p_dim: 'utm_source' }),
      ]);
      const days: DayRow[] = daily.map((d) => ({ day: String(d.day).slice(0, 10), visitors: n(d.checkers), pageviews: 0, simulations: n(d.checks), leads: n(d.leads) }));
      const counts = (rows: BreakdownRow[]): Count[] =>
        rows.filter((r) => n(r.checkers) > 0).map((r) => ({ key: r.key || 'Accès direct', n: n(r.checkers), visitors: n(r.checkers) })).sort((a, b) => b.n - a.n).slice(0, 12);
      const steps: [string, string, number][] = [
        ['simulation', 'Ont vérifié un DPE', n(f.checkers)],
        ['lead', 'Ont laissé un e-mail', n(f.leads)],
        ['checkout', 'Ont commencé un paiement', n(f.checkouts)],
        ['payment', 'Ont payé', n(f.buyers)],
      ];
      const funnel: FunnelStep[] = steps.map(([k, label, v], i) => (i ? { key: k, label, visitors: v, rate: pct(v, steps[i - 1][2]), dropOff: steps[i - 1][2] - v } : { key: k, label, visitors: v }));
      return {
        days, visitors: n(kpis.checkers), pageviews: 0, sources: counts(ref), utm: counts(utm), pages: [], funnel,
        revenueCents: n(kpis.revenue_cents),
        notes: ['Portail DPE ne stocke pas les pages vues : « visiteurs » compte les personnes ayant vérifié un DPE, comme dans son admin.'],
      };
    },

    async leads() {
      const since = instants(rangeOf(120)).from;
      const { data, error } = await client()
        .from('dpe_leads')
        .select('id,email,created_at,intent,segment,lead_type,source,phone,marketing_consent,surface,address,postal_code,dpe_number,current_label,report_generated_at,visitor_id')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw new Error(`dpe_leads: ${error.message}`);
      const rows = ((data ?? []) as LeadRow[]).filter((r) => r.email && !isTest(r.email));

      const ids = rows.map((r) => r.id);
      const dispatches = new Map<string, DispatchRow>();
      for (let i = 0; i < ids.length; i += 200) {
        const { data: d } = await client().from('lead_dispatches').select('lead_id,status,sent_at,price_cents,paid_at').in('lead_id', ids.slice(i, i + 200));
        for (const x of (d ?? []) as DispatchRow[]) dispatches.set(x.lead_id, x);
      }

      return rows.map((r): Lead => {
        const dsp = dispatches.get(r.id);
        const status: DeliveryStatus = dsp ? DISPATCH[dsp.status] ?? 'unknown' : r.report_generated_at ? 'report_sent' : 'new';
        return {
          product: 'portail-dpe', id: r.id, at: Date.parse(r.created_at), email: r.email,
          role: roleOf(r), rawRole: [r.intent, r.segment].filter(Boolean).join(' · ') || undefined,
          sizeTier: tierOf(r.surface, TIERS),
          hasPhone: !!r.phone, consent: !!r.marketing_consent,
          building: { id: r.dpe_number ?? undefined, address: r.address ?? r.postal_code ?? undefined, label: r.current_label ? `DPE ${r.current_label}` : undefined },
          // dpe_leads.source is the button that produced the lead, not the traffic source.
          delivery: { status, reportSent: r.report_generated_at ? Date.parse(r.report_generated_at) : undefined, partnerNotified: dsp?.sent_at ? Date.parse(dsp.sent_at) : undefined },
          revenueCents: dsp?.paid_at ? n(dsp.price_cents) : undefined,
        };
      });
    },
  };
}
