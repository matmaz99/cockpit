import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminConfigured, isAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Connexion' };
export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await isAdmin()) redirect('/');
  const { e } = await searchParams;
  return (
    <main className="sp-admin-login">
      <form className="sp-lead" method="post" action="/api/login">
        <div className="ck-brand"><b>Cockpit</b><span>portefeuille</span></div>
        <h1 className="sp-cta-box__title">Connexion</h1>
        {!adminConfigured() && <div className="sp-error" role="alert">ADMIN_USER et ADMIN_PASSWORD ne sont pas définis sur ce déploiement.</div>}
        {e && <div className="sp-error" role="alert">Identifiant ou mot de passe incorrect.</div>}
        <label className="sp-field"><span>Identifiant</span><input name="user" autoComplete="username" required /></label>
        <label className="sp-field"><span>Mot de passe</span><input name="password" type="password" autoComplete="current-password" required /></label>
        <div className="sp-cta"><button type="submit" className="sp-btn sp-btn--primary sp-btn--md"><span>Se connecter</span></button></div>
      </form>
    </main>
  );
}
