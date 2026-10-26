import type { Role, SizeTier } from './model';

/** Free-text role from a form (French or English) to the shared role list. */
export function normaliseRole(raw: string | undefined | null): Role {
  const r = (raw ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  if (!r) return 'unknown';
  const known: Role[] = ['owner', 'tenant', 'manager', 'advisor', 'syndic', 'pro', 'public', 'data', 'individual'];
  if ((known as string[]).includes(r)) return r as Role;
  if (/syndic|conseil syndical|copropri/.test(r)) return 'syndic';
  if (/proprietaire|bailleur|owner|fonciere|investisseur/.test(r)) return 'owner';
  if (/locataire|occupant|tenant|preneur|exploitant|enseigne/.test(r)) return 'tenant';
  if (/gestionnaire|gestion|property|facility|asset|manager|responsable (energie|immobilier|travaux)/.test(r)) return 'manager';
  if (/bureau d.?etudes|conseil|consultant|integrateur|installateur|diagnostiqueur|advisor|architecte/.test(r)) return 'advisor';
  if (/collectivite|mairie|commune|public|etat|hopital|ecole/.test(r)) return 'public';
  if (/particulier|individual/.test(r)) return 'individual';
  return 'unknown';
}

/** A size in m² to a tier, with product-specific thresholds [S|M, M|L, L|XL]. */
export function tierOf(m2: number | null | undefined, cuts: [number, number, number]): SizeTier {
  if (m2 === null || m2 === undefined || !Number.isFinite(m2) || m2 <= 0) return 'unknown';
  if (m2 < cuts[0]) return 'S';
  if (m2 < cuts[1]) return 'M';
  if (m2 < cuts[2]) return 'L';
  return 'XL';
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Propriétaire', tenant: 'Locataire / exploitant', manager: 'Gestionnaire', advisor: 'Conseil / BE',
  syndic: 'Syndic', pro: 'Professionnel', public: 'Acteur public', data: 'Achat de données', individual: 'Particulier', unknown: 'Non renseigné',
};

/** Test addresses never count as leads. */
export const isTestEmail = (e: string) => /@[^@]*\.test$|@example\.(com|org|fr)$|^test@/i.test(e.trim());
