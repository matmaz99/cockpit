import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

// Copied from Parksun (src/lib/admin/auth.ts); only the cookie name changes.

/**
 * One admin account, from the environment: ADMIN_USER and ADMIN_PASSWORD. A successful
 * login sets an httpOnly cookie carrying its expiry and an HMAC of it under ADMIN_SECRET;
 * changing the password or the secret signs everyone out.
 */

export const COOKIE = 'ck_admin';
const TTL = 7 * 86_400_000; // a week

const secret = () => {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error('ADMIN_SECRET missing');
  return `${s}:${process.env.ADMIN_PASSWORD ?? ''}`;
};

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');
const same = (a: string, b: string) => {
  const x = createHash('sha256').update(a).digest();
  const y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
};

export const adminConfigured = () => !!(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);

export function checkCredentials(user: string, password: string): boolean {
  if (!adminConfigured()) return false;
  // Both compared, always, so the timing says nothing about which one was wrong.
  const u = same(user, process.env.ADMIN_USER!);
  const p = same(password, process.env.ADMIN_PASSWORD!);
  return u && p;
}

export function sessionToken(now = Date.now()): { value: string; expires: Date } {
  const exp = String(now + TTL);
  return { value: `${exp}.${sign(exp)}`, expires: new Date(now + TTL) };
}

export function validToken(token: string | undefined): boolean {
  if (!token || !adminConfigured()) return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  try {
    return same(mac, sign(exp));
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return validToken(c.get(COOKIE)?.value);
}
