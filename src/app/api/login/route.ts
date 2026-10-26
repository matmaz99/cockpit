import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials, COOKIE, sessionToken } from '@/lib/auth';

/** POST /api/login (form): sets the session cookie and goes to /, or back to the form. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const user = String(form?.get('user') ?? '').slice(0, 100);
  const password = String(form?.get('password') ?? '').slice(0, 200);
  const back = new URL('/login?e=1', req.url);
  if (!checkCredentials(user, password)) {
    await new Promise((r) => setTimeout(r, 800)); // slows guessing
    return NextResponse.redirect(back, 303);
  }
  const { value, expires } = sessionToken();
  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.cookies.set(COOKIE, value, { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'lax', path: '/', expires });
  return res;
}
