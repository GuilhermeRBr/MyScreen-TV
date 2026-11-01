/**
 * Proxy reverso para o backend NestJS.
 *
 * Por que existe este proxy:
 * - O backend roda em domínio diferente do frontend (ex: Railway vs Vercel).
 * - Cookies HttpOnly só funcionam quando setados pelo mesmo domínio que o browser
 *   está acessando. Se o browser fizer fetch direto para o backend externo,
 *   o Set-Cookie chega ao browser mas fica associado ao domínio do backend —
 *   o middleware do Next.js (que roda no domínio da Vercel) nunca enxerga o cookie.
 * - Com o proxy, o browser chama /api/proxy/... (mesmo domínio Vercel), o Next.js
 *   repassa ao backend, captura o Set-Cookie da resposta e o reescreve como cookie
 *   do domínio Vercel. O middleware passa a ler o token normalmente.
 *
 * Rota: /api/[...path] → BACKEND_URL/[...path]
 *
 * Nota: BACKEND_URL não é NEXT_PUBLIC_ — a URL interna do backend nunca é exposta
 * ao browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

/** Cabeçalhos que não devem ser repassados ao backend nem ao cliente. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

function stripHopByHop(headers: Headers): Headers {
  const clean = new Headers(headers);
  HOP_BY_HOP_HEADERS.forEach((h) => clean.delete(h));
  return clean;
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const backendPath = '/' + pathSegments.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${backendPath}${search}`;

  // Repassa os cookies do browser para o backend (ex: access_token, refresh_token)
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // Constrói os headers de saída
  const outHeaders = stripHopByHop(request.headers);
  if (cookieHeader) {
    outHeaders.set('cookie', cookieHeader);
  }
  // Garante que o backend receba o Content-Type correto
  outHeaders.set('host', new URL(BACKEND_URL).host);

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: outHeaders,
    body: body ?? null,
    // Não seguir redirects — repassamos tal como está
    redirect: 'manual',
  });

  // Copia os headers da resposta do backend
  const responseHeaders = stripHopByHop(backendResponse.headers);

  // Repassa cookies do backend para o browser (Set-Cookie)
  // O cookie ficará associado ao domínio Vercel (correto).
  const setCookieValues = backendResponse.headers.getSetCookie?.() ??
    (backendResponse.headers.get('set-cookie')
      ? [backendResponse.headers.get('set-cookie')!]
      : []);

  // Remove o set-cookie consolidado antes de adicionar individualmente
  responseHeaders.delete('set-cookie');

  const responseBody =
    backendResponse.status === 204 ? null : await backendResponse.arrayBuffer();

  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  // Adiciona cada Set-Cookie individualmente
  setCookieValues.forEach((value) => {
    response.headers.append('set-cookie', value);
  });

  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}
