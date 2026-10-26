import 'server-only';
import type { ProductId } from '../model';
import { productById } from '../products';
import { parksunAdapter } from './parksun';
import { staticSiteAdapter } from './static-site';
import type { ProductAdapter } from './types';

import { portailDpeAdapter } from './portail-dpe';

const none: ProductAdapter = { tracking: 'none', readable: () => false, events: async () => [], leads: async () => [] };

export function adapterFor(id: ProductId): ProductAdapter {
  const p = productById(id);
  if (!p) return none;
  if (p.store.kind === 'supabase') return portailDpeAdapter(process.env[p.store.urlEnv], process.env[p.store.keyEnv]);
  const blob = { storeName: p.store.storeName, token: process.env[p.store.tokenEnv] };
  if (p.store.layout === 'parksun') return parksunAdapter(blob);
  return staticSiteAdapter(id, blob, 'installed');
}
