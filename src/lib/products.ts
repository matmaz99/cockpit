import type { ProductId } from './model';

/**
 * The four products and where each one's data lives. Only env var NAMES appear here;
 * values are set on the cockpit's Vercel project and never committed.
 */
export interface Product {
  id: ProductId;
  name: string;
  url: string;
  regulation: string;
  vercelProjectId: string;
  repo: string; // owner/name on GitHub
  resendDomains: string[];
  store:
    | { kind: 'supabase'; urlEnv: string; keyEnv: string }
    | { kind: 'blob'; layout: 'parksun' | 'static-site'; tokenEnv: string; storeName: string };
  docs: boolean; // docs/STRATEGY.md, DECISIONS.md, WEEKLY.md in the repo
  adminUrl?: string;
}

export const VERCEL_TEAM_ID = 'team_A7vYAI9Dn7umm6L9BelX5TfZ';

export const PRODUCTS: Product[] = [
  {
    id: 'portail-dpe',
    name: 'Portail DPE',
    url: 'https://www.portail-dpe.fr',
    regulation: 'DPE individuel, interdictions de louer',
    vercelProjectId: 'prj_prAQkYRvxKDbloEawIKZAzeBRcrI',
    repo: 'matmaz99/mondpe',
    resendDomains: ['portail-dpe.fr', 'rapport.mondpe2026.fr'],
    store: { kind: 'supabase', urlEnv: 'MONDPE_SUPABASE_URL', keyEnv: 'MONDPE_SUPABASE_SERVICE_KEY' },
    docs: false,
    adminUrl: 'https://www.portail-dpe.fr/admin',
  },
  {
    id: 'parksun',
    name: 'Parksun',
    url: 'https://www.parksun.fr',
    regulation: 'Loi APER, ombrières de parking',
    vercelProjectId: 'prj_kKfbd1ebnjPvBeLwebIPhR6N8Rtt',
    repo: 'matmaz99/Sunpark',
    resendDomains: ['parksun.fr'],
    store: { kind: 'blob', layout: 'parksun', tokenEnv: 'PARKSUN_BLOB_TOKEN', storeName: 'parksun-analytics' },
    docs: false,
    adminUrl: 'https://www.parksun.fr/admin',
  },
  {
    id: 'cadastre-tertiaire',
    name: 'Cadastre tertiaire',
    url: 'https://www.cadastre-tertiaire.fr',
    regulation: 'Décret tertiaire, décret BACS',
    vercelProjectId: 'prj_os6jNqKSFD8EVjNWqieYjjLGnBQB',
    repo: 'matmaz99/tertiaire-20230',
    resendDomains: ['cadastre-tertiaire.fr'],
    store: { kind: 'blob', layout: 'static-site', tokenEnv: 'TERTIAIRE_BLOB_TOKEN', storeName: 'tertiaire-2030-events' },
    docs: true,
  },
  {
    id: 'dpe-immeuble',
    name: 'DPE immeuble',
    url: 'https://dpe-immeuble.fr',
    regulation: 'DPE collectif, PPPT, RNIC',
    vercelProjectId: 'prj_A4pbNrmCxfRIrdEnn3ipbOVg4Nx8',
    repo: 'matmaz99/dpecollectif',
    resendDomains: [],
    store: { kind: 'blob', layout: 'static-site', tokenEnv: 'DPEIMMEUBLE_BLOB_TOKEN', storeName: 'dpe-immeuble-events' },
    docs: true,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id) ?? null;
