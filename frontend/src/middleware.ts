import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = [
  '/series',
  '/filmes',
  '/perfil',
  '/minha-lista',
  '/explorar',
];

const PUBLIC_PATHS = ['/login', '/cadastro', '/forgot-password', '/reset-password'];

// Tempo máximo que o middleware aguarda o backend responder ao refresh.
// Se o Render estiver em cold start, não bloqueamos a navegação do usuário:
// ele vai para a página normalmente e o lib/api.ts cuida do refresh na
// primeira chamada de API (que também vai acordar o servidor).
const REFRESH_TIMEOUT_MS = 3000;

/**
 * Tenta renovar o access_token usando o refresh_token via chamada server-side
 * ao backend. Retorna a resposta do endpoint /auth/refresh para que os cookies
 * renovados possam ser repassados ao browser.
 *
 * Aborta após REFRESH_TIMEOUT_MS para não travar a navegação em caso de
 * cold start do backend (Render plano gratuito, etc.).
 */
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
    // Timeout ou erro de rede — deixa o lib/api.ts tratar no client
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  const isPublicOnly = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Access token presente: segue normalmente
  if (accessToken) {
    if (isPublicOnly) {
      return NextResponse.redirect(new URL('/series', request.url));
    }
    return NextResponse.next();
  }

  // Sem access token mas com refresh token: tenta renovar silenciosamente
  if (refreshToken) {
    const refreshResponse = await tryRefreshServerSide(request);

    if (refreshResponse) {
      // Refresh bem-sucedido: repassa os cookies renovados ao browser
      // e permite a navegação normalmente
      const nextResponse = isPublicOnly
        ? NextResponse.redirect(new URL('/series', request.url))
        : NextResponse.next();

      // Copia os Set-Cookie do backend para a resposta do middleware
      const setCookieHeader = refreshResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        nextResponse.headers.set('set-cookie', setCookieHeader);
      }

      return nextResponse;
    }

    // Refresh falhou (token revogado ou expirado): trata como não autenticado
  }

  // Sem tokens válidos
  if (isProtected) {
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
