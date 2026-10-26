import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, validToken } from '@/lib/auth';

/**
 * Every page and API route needs the operator cookie, except the login form, the login
 * and logout endpoints, and the cron endpoint (which checks CRON_SECRET itself).
 * Proxy runs on the Node.js runtime in Next 16, so the HMAC check from lib/auth works here.
 */
const OPEN = ['/login', '/api/login', '/api/logout', '/api/cron/'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN.some((p) => pathname === p || (p.endsWith('/') && pathname.startsWith(p)))) return NextResponse.next();
  if (validToken(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|brand/).*)'],
};
