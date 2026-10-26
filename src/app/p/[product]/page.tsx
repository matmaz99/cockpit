import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CountTable, DailyBars, Funnel } from '@/components/Charts';
import { TopBar } from '@/components/TopBar';
import { Badge, Metric } from '@/components/ds/Metric';
import type { ProductSnapshot } from '@/lib/model';
import { productById } from '@/lib/products';
import { parseDays } from '@/lib/range';
import { ROLE_LABELS } from '@/lib/roles';
import { snapshot } from '@/lib/snapshot';

export const dynamic = 'force-dynamic';

const TABS = [
  { id: 'trafic', label: 'Trafic' },
  { id: 'entonnoir', label: 'Entonnoir' },
  { id: 'leads', label: 'Leads' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const fr = (n: number) => n.toLocaleString('fr-FR');
const delta = (v: number | null) => (v === null ? 'pas de semaine de comparaison' : `${v > 0 ? '+' : ''}${v} % sur 7 jours`);
const when = (t: number) => new Date(t).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export async function generateMetadata({ params }: { params: Promise<{ product: string }> }): Promise<Metadata> {
  const p = productById((await params).product);
  return { title: p?.name ?? 'Produit' };
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ product: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const p = productById((await params).product);
  if (!p) notFound();
  const sp = await searchParams;
  const days = parseDays(sp.days);
  const tab: Tab = (TABS.find((t) => t.id === sp.tab)?.id ?? 'trafic') as Tab;
  const s = await snapshot(p.id, days);
  const base = `/p/${p.id}`;
  const href = (t: Tab) => `${base}?tab=${t}&days=${days}`;

  return (
    <main className="sp-admin">
      <TopBar days={days} path={`${base}`} query={`tab=${tab}`} />
      <section className="ck-head">
        <div>
          <h1 className="ck-title">{p.name}</h1>
          <p className="ck-note">{p.regulation} · <Link href={p.url}>{p.url.replace(/^https:\/\//, '')}</Link>{p.adminUrl && <> · <Link href={p.adminUrl}>admin du produit</Link></>}</p>
        </div>
        <nav className="sp-admin__tabs" aria-label="Sections">
          {TABS.map((t) => <Link key={t.id} href={href(t.id)} className={t.id === tab ? 'is-on' : ''}>{t.label}</Link>)}
        </nav>
      </section>
      {s.warnings.length > 0 && <div className="ck-warn">{s.warnings.map((w) => <p key={w}>{w}</p>)}</div>}
      {tab === 'trafic' && <Traffic s={s} days={days} />}
      {tab === 'entonnoir' && <FunnelTab s={s} />}
      {tab === 'leads' && <Leads s={s} />}
      <p className="ck-note">Données lues le {when(s.generatedAt)}, mises en cache dix minutes.</p>
    </main>
  );
}

function Traffic({ s, days }: { s: ProductSnapshot; days: number }) {
  const t = s.traffic;
  return (
    <div className="sp-admin__body">
      <div className="sp-stats">
        <Metric label="Visiteurs" value={fr(t.visitors)} caption={delta(t.wow.visitors)} />
        <Metric label="Pages vues" value={fr(t.pageviews)} />
        <Metric label="Simulations" value={fr(t.days.reduce((a, d) => a + d.simulations, 0))} />
        <Metric label="Leads" value={fr(s.leads.total)} caption={delta(t.wow.leads)} />
      </div>
      <div className="sp-admin-grid">
        <section className="sp-admin-card"><DailyBars title="Visiteurs" unit="visiteurs" data={t.days.map((d) => ({ day: d.day, value: d.visitors }))} /></section>
        <section className="sp-admin-card"><DailyBars title="Simulations" unit="simulations" data={t.days.map((d) => ({ day: d.day, value: d.simulations }))} /></section>
      </div>
      <div className="sp-admin-grid">
        <CountTable title={`Sources (${days} j)`} keyLabel="Référent" rows={t.sources} />
        <CountTable title="Campagnes UTM" keyLabel="source / medium / campagne" rows={t.utm} empty="Aucune visite marquée UTM." />
        <CountTable title="Pages" keyLabel="Page" rows={t.pages} />
      </div>
    </div>
  );
}

function FunnelTab({ s }: { s: ProductSnapshot }) {
  const worst = s.funnel.slice(1).reduce<typeof s.funnel[number] | null>((w, st) => (!w || (st.dropOff ?? 0) > (w.dropOff ?? 0) ? st : w), null);
  return (
    <div className="sp-admin__body">
      <section className="sp-admin-card">
        <div className="sp-label">Entonnoir · chaque étape incluse dans la précédente</div>
        <Funnel steps={s.funnel} />
        {worst && worst.dropOff ? <p className="ck-note">Plus forte perte : {fr(worst.dropOff)} visiteurs avant « {worst.label} ».</p> : null}
      </section>
      <section className="sp-admin-card">
        <table className="sp-table">
          <thead><tr><th>Étape</th><th className="num">Visiteurs</th><th className="num">Taux</th><th className="num">Perdus</th></tr></thead>
          <tbody>{s.funnel.map((st) => (
            <tr key={st.key}><td>{st.label}</td><td className="num">{fr(st.visitors)}</td><td className="num">{st.rate === undefined ? '' : `${st.rate.toLocaleString('fr-FR')} %`}</td><td className="num">{st.dropOff === undefined ? '' : fr(st.dropOff)}</td></tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}

const STATUS: Record<string, string> = { new: 'Nouveau', report_sent: 'Rapport envoyé', dispatched: 'Transmis', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré', unknown: 'Inconnu' };

function Leads({ s }: { s: ProductSnapshot }) {
  const l = s.leads;
  return (
    <div className="sp-admin__body">
      <div className="sp-stats">
        <Metric label="Leads sur la période" value={fr(l.total)} />
        <Metric label="Leads 7 derniers jours" value={fr(l.last7)} />
        <Metric label="Revenu" value={fr(Math.round(l.revenueCents / 100))} unit="€" />
      </div>
      <div className="sp-admin-grid">
        <CountTable title="Par profil" keyLabel="Profil" rows={l.byRole} empty="Aucun lead." />
        <CountTable title="Par taille" keyLabel="Taille" rows={l.byTier} empty="Aucun lead." />
      </div>
      <section className="sp-admin-card">
        <div className="sp-label">Derniers leads</div>
        {l.recent.length ? (
          <div className="sp-admin-scroll">
            <table className="sp-table">
              <thead><tr><th>Date</th><th>E-mail</th><th>Profil</th><th>Taille</th><th>Bâtiment</th><th>Source</th><th>Suivi</th></tr></thead>
              <tbody>{l.recent.map((x) => (
                <tr key={x.id}>
                  <td>{when(x.at)}</td>
                  <td>{x.email}{x.hasPhone && <> <Badge tone="solar">tél.</Badge></>}</td>
                  <td title={x.rawRole}>{ROLE_LABELS[x.role]}</td>
                  <td>{x.sizeTier === 'unknown' ? '' : x.sizeTier}</td>
                  <td>{x.building?.address || x.building?.label || ''}</td>
                  <td>{x.source?.utmSource || x.source?.referrer || ''}</td>
                  <td>{STATUS[x.delivery.status]}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="sp-body-sm">Aucun lead sur la période.</p>}
      </section>
    </div>
  );
}
