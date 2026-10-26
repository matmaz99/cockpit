import 'server-only';
import type { ProductId } from '../model';
import { productById } from '../products';
import { parksunAdapter } from './parksun';
import { staticSiteAdapter } from './static-site';
import type { ProductAdapter } from './types';

/** Portail DPE reads Supabase; its adapter lands on day 3. Until then it reports "not wired". */
const pending: ProductAdapter = { tracking: 'installed', readable: () => false, events: async () => [], leads: async () => [] };

export function adapterFor(id: ProductId): ProductAdapter {
  const p = productById(id);
  if (!p || p.store.kind !== 'blob') return pending;
  const blob = { storeName: p.store.storeName, token: process.env[p.store.tokenEnv] };
  if (p.store.layout === 'parksun') return parksunAdapter(blob);
  // DPE immeuble shows a holding page with no tracking script yet.
  return staticSiteAdapter(id, blob, id === 'dpe-immeuble' ? 'none' : 'installed');
}
