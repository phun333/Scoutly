import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '~/server/auth';

const ADMIN_PREFIXES = ['/dashboard', '/forms/new', '/forms/manage'];

export default auth((req) => {
  const { nextUrl } = req;

  const isAdminRoute = ADMIN_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix));

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const signInUrl = new URL('/auth/sign-in', nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', nextUrl.toString());
    return NextResponse.redirect(signInUrl);
  }

  if (req.auth.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/forms/new', '/forms/manage/:path*'],
};
