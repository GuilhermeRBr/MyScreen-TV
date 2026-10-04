import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/series',
  '/filmes',
  '/perfil',
  '/minha-lista',
  '/explorar',
];

const PUBLIC_PATHS = ['/login', '/cadastro', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = Boolean(accessToken);

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isPublicOnly = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/series', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};
