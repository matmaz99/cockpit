import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { get, list } from '@vercel/blob';

/**
 * Read-only access to a product's private Blob store. Ported from Parksun's
 * src/lib/analytics/store.ts with every write removed: the cockpit only calls list() and
 * get(), never put() or del(), so it cannot disturb a product's data or race Parksun's
 * own compaction of past days.
 *
 * Each product has its own token (Vercel Blob has no read-only token, so the code is the
 * guarantee). Without a token, and only when CK_FIXTURES_DIR is set (local development),
 * the same layout is read from <CK_FIXTURES_DIR>/<storeName>/ on disk.
 */

export interface BlobSource { storeName: string; token: string | undefined }

const fixtures = (s: BlobSource) => (!s.token && process.env.CK_FIXTURES_DIR ? path.join(process.env.CK_FIXTURES_DIR, s.storeName) : null);

export const blobReadable = (s: BlobSource) => !!s.token || !!fixtures(s);

export async function readJson<T>(s: BlobSource, pathname: string): Promise<T | null> {
  const dir = fixtures(s);
  if (dir) {
    try { return JSON.parse(await fs.readFile(path.join(dir, pathname), 'utf8')) as T; } catch { return null; }
  }
  if (!s.token) return null;
  // A file can vanish between list() and get() (Parksun merges a past day's parts): skip it.
  const r = await get(pathname, { access: 'private', token: s.token, useCache: false }).catch(() => null);
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  try { return (await new Response(r.stream).json()) as T; } catch { return null; }
}

/** Every pathname under a prefix. On disk, walks the folder recursively. */
export async function listPaths(s: BlobSource, prefix: string): Promise<string[]> {
  const dir = fixtures(s);
  if (dir) {
    const walk = async (rel: string): Promise<string[]> => {
      const entries = await fs.readdir(path.join(dir, rel), { withFileTypes: true }).catch(() => []);
      const out: string[] = [];
      for (const e of entries) {
        const p = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) out.push(...(await walk(p)));
        else out.push(p);
      }
      return out;
    };
    const base = prefix.includes('/') ? prefix.slice(0, prefix.lastIndexOf('/')) : '';
    return (await walk(base)).filter((p) => p.startsWith(prefix)).sort();
  }
  if (!s.token) return [];
  const out: string[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix, cursor, limit: 1000, token: s.token });
    out.push(...r.blobs.map((b) => b.pathname));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

/** In parallel, a few at a time. */
export async function pool<T, R>(items: T[], n: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await f(items[k]);
    }
  }));
  return out;
}
