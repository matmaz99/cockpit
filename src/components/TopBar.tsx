import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const RANGES = [7, 30, 90];

/** Brand, period selector and session actions; shared by every page. */
export function TopBar({ days, path }: { days?: number; path: string }) {
  return (
    <header className="sp-admin__top">
      <Link href="/" className="ck-brand"><b>Cockpit</b><span>portefeuille</span></Link>
      {days !== undefined && (
        <nav className="sp-admin__ranges" aria-label="Période">
          {RANGES.map((d) => <Link key={d} href={`${path}?days=${d}`} className={d === days ? 'is-on' : ''}>{d} j</Link>)}
        </nav>
      )}
      <div className="ck-top-actions" style={days === undefined ? { marginLeft: 'auto' } : undefined}>
        <ThemeToggle />
        <form method="post" action="/api/logout"><button type="submit" className="sp-btn sp-btn--quiet sp-btn--sm"><span>Déconnexion</span></button></form>
      </div>
    </header>
  );
}
