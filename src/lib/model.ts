/**
 * The normalised shapes every product adapter returns. Pages render only these; nothing
 * product-specific reaches a component. Times are epoch milliseconds, days are
 * YYYY-MM-DD in Europe/Paris.
 */

export type ProductId = 'portail-dpe' | 'parksun' | 'cadastre-tertiaire' | 'dpe-immeuble';

export interface Count { key: string; n: number; visitors?: number }

/** Where a visitor came from. First touch when the product keeps it per visitor, else the session's first hit. */
export interface Source {
  kind: 'first-touch' | 'session';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landing?: string;
}

export type EventType = 'pageview' | 'simulation' | 'result' | 'lead' | 'contact' | 'payment' | 'other';

export interface Event {
  product: ProductId;
  at: number;
  type: EventType;
  rawType: string; // the product's own name: result_view, simulate, report_request…
  visitor: string;
  session?: string;
  path?: string;
  source?: Source;
  device?: 'mobile' | 'tablet' | 'desktop';
  props?: Record<string, unknown>;
}

export type Role = 'owner' | 'tenant' | 'manager' | 'advisor' | 'syndic' | 'pro' | 'public' | 'data' | 'individual' | 'unknown';
export type SizeTier = 'S' | 'M' | 'L' | 'XL' | 'unknown';
export type DeliveryStatus = 'new' | 'report_sent' | 'dispatched' | 'accepted' | 'rejected' | 'expired' | 'unknown';

export interface Lead {
  product: ProductId;
  id: string;
  at: number;
  email: string;
  role: Role;
  rawRole?: string;
  sizeTier: SizeTier;
  hasPhone: boolean;
  consent: boolean;
  building?: { id?: string; address?: string; label?: string };
  source?: Source;
  delivery: { reportSent?: number; partnerNotified?: number; status: DeliveryStatus };
  revenueCents?: number;
}

export interface FunnelStep {
  key: EventType;
  label: string;
  visitors: number;
  rate?: number; // % of the previous step
  dropOff?: number; // visitors lost since the previous step
}

export interface DayRow { day: string; visitors: number; pageviews: number; simulations: number; leads: number }

export interface TrafficSummary {
  days: DayRow[];
  visitors: number;
  pageviews: number;
  sources: Count[];
  utm: Count[];
  pages: Count[];
  wow: { visitors: number | null; leads: number | null }; // % change, this week vs last
}

export interface OpsStatus {
  deploy: { state: string; at: number; sha?: string; message?: string; url: string } | null;
  domains: { host: string; verified: boolean }[];
  email: { domain: string; status: 'verified' | 'pending' | 'none'; sent30d: number; bounced30d: number } | null;
  errors24h: { name: string; count: number; route: string; lastSeen: number }[];
  data: { dataset: string; version: string; asOf?: string; stale: boolean }[];
  tracking: 'live' | 'no-data' | 'none';
}

export interface Governance {
  gates: { title: string; date?: string; reviewDate?: string; overdue: boolean }[];
  weekly: { week: string; lines: string[] }[];
  next: { rank: number; title: string; status?: string }[];
  source: 'github' | 'none';
  sourceUrl?: string;
}

export interface Health { level: 'green' | 'amber' | 'red' | 'unknown'; reasons: string[] }

export interface ProductSnapshot {
  product: ProductId;
  generatedAt: number;
  rangeDays: number;
  traffic: TrafficSummary;
  funnel: FunnelStep[];
  leads: { total: number; last7: number; byRole: Count[]; byTier: Count[]; recent: Lead[]; revenueCents: number };
  ops: OpsStatus;
  governance: Governance;
  health: Health;
  warnings: string[];
}
