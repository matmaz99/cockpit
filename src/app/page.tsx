import type { Metadata } from 'next';
import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/ds/Metric';
import { PRODUCTS, type Product } from '@/lib/products';
import { snapshot } from '@/lib/snapshot';

export const metadata: Metadata = { title: 'Portefeuille' };
export const dynamic = 'force-dynamic';

/** Which read credentials this deployment has, by env var name only. Values are never read here. */
function sources(p: Product): { label: string; ok: boolean }[] {
  const has = (k: string) => !!process.env[k];
  const store = p.store.kind === 'supabase'
    ? { label: 'Supabase', ok: has(p.store.urlEnv) && has(p.store.keyEnv) }
    : { label: `Blob ${p.store.storeName}`, ok: has(p.store.tokenEnv) };
  const out = [store, { label: 'Vercel', ok: has('VERCEL_API_TOKEN') }];
  if (p.resendDomains.length) out.push({ label: 'Resend', ok: has('RESEND_API_KEY') });
  if (p.docs) out.push({ label: 'GitHub docs', ok: has('GITHUB_READ_TOKEN') });
  return out;
}

export default async function Portfolio({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { days: d } = await searchParams;
  const days = [7, 30, 90].includes(Number(d)) ? Number(d) : 7;
  const snaps = await Promise.all(PRODUCTS.map((p) => snapshot(p.id, days).catch(() => null)));
  const fr = (n: number) => n.toLocaleString('fr-FR');
  const wow = (v: number | null | undefined) => (v === null || v === undefined ? '' : `${v > 0 ? '+' : ''}${v} %`);
  return (
    <main className="sp-admin">
      <TopBar days={days} path="/" />
      <section className="sp-admin-card">
        <div className="sp-label">Portefeuille · {PRODUCTS.length} produits</div>
        <div className="sp-admin-scroll">
          <table className="sp-table ck-rows">
            <thead>
              <tr>
                <th>Produit</th>
                <th className="num">Visiteurs {days} j</th>
                <th className="num">Leads {days} j</th>
                <th className="num">Revenu 30 j</th>
                <th>Dernier déploiement</th>
                <th className="num">Décisions ouvertes</th>
                <th>Sources branchées</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.map((p, i) => {
                const s = snaps[i];
                const live = !!s && !s.warnings.some((w) => w.startsWith('Source') || w.startsWith('Lecture'));
                return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/p/${p.id}?days=${days}`} className="ck-name"><i className="ck-health" title="Santé : calculée à partir du jour 5" />{p.name}</Link>
                    <span className="ck-sub">{p.regulation}</span>
                  </td>
                  <td className="num">{live ? <>{fr(s!.traffic.visitors)}<span className="ck-sub">{wow(s!.traffic.wow.visitors)}</span></> : <span className="ck-muted">–</span>}</td>
                  <td className="num">{live ? <>{fr(s!.leads.total)}<span className="ck-sub">{wow(s!.traffic.wow.leads)}</span></> : <span className="ck-muted">–</span>}</td>
                  <td className="num ck-muted">–</td>
                  <td className="ck-muted">–</td>
                  <td className="num ck-muted">–</td>
                  <td>
                    <span className="ck-badges">
                      {sources(p).map((s) => (
                        <Badge key={s.label} tone={s.ok ? 'solar' : 'neutral'}>{s.label}{s.ok ? '' : ' · à brancher'}</Badge>
                      ))}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="ck-note">
          Visiteurs et leads sur la période, variation sur les 7 derniers jours. Revenu, déploiements et décisions arrivent aux jours 3 à 5. Sites : {PRODUCTS.map((p, i) => (
            <span key={p.id}>{i ? ', ' : ''}<Link href={p.url}>{p.url.replace(/^https:\/\//, '')}</Link></span>
          ))}.
        </p>
      </section>
    </main>
  );
}
