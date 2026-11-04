import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/series',
  '/filmes',
  '/perfil',
  '/minha-lista',
  '/explorar',
];

const ADMIN_PATHS = ['/admin'];

const PUBLIC_PATHS = ['/login', '/cadastro', '/forgot-password', '/reset-password'];

const REFRESH_TIMEOUT_MS = 3000;

async function tryRefreshServerSide(
  request: NextRequest,
): Promise<Response | null> {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return null;
  }

  const backendUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  try {
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Decodifica o payload do JWT sem verificar a assinatura.
 * Usado apenas para leitura de claims públicos (role) no middleware.
 */
function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isAdmin = ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isPublicOnly = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Access token presente
  if (accessToken) {
    if (isPublicOnly) {
      return NextResponse.redirect(new URL('/series', request.url));
    }

    // Rotas admin: verifica role no payload do token
    if (isAdmin) {
      const payload = decodeJwtPayload(accessToken);
      if (!payload || payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/series', request.url));
      }
    }

    return NextResponse.next();
  }

  // Sem access token mas com refresh token: tenta renovar silenciosamente
  if (refreshToken) {
    const refreshResponse = await tryRefreshServerSide(request);

    if (refreshResponse) {
      const nextResponse = isPublicOnly
        ? NextResponse.redirect(new URL('/series', request.url))
        : NextResponse.next();

      const setCookieHeader = refreshResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }

      return nextResponse;
    }
  }

  // Sem tokens válidos
  if (isProtected || isAdmin) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};
