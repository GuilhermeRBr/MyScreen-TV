/**
 * Proxy reverso para o backend NestJS.
 *
 * Por que existe este proxy:
 * - O backend roda em domínio diferente do frontend (Render vs Vercel).
 * - Cookies HttpOnly só funcionam quando setados pelo mesmo domínio que o browser
 *   acessa. Se o browser chamar o backend diretamente, o Set-Cookie fica associado
 *   ao domínio do backend — o middleware do Next.js nunca enxerga o cookie.
 * - Com o proxy, o browser chama /api/... (domínio Vercel), o Next.js repassa ao
 *   backend, captura o Set-Cookie e o reescreve no domínio Vercel.
 *
 * Rota: /api/[...path] → BACKEND_URL/[...path]
 *
 * BACKEND_URL é server-only (sem prefixo NEXT_PUBLIC_).
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_URL ?? '').replace(/\/$/, '');

/** Cabeçalhos hop-by-hop que não devem ser repassados. */
const HOP_BY_HOP = new Set([
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

function buildForwardHeaders(request: NextRequest): Headers {
  const out = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });

  if (BACKEND_URL) {
    try {
      out.set('host', new URL(BACKEND_URL).host);
    } catch {
      // BACKEND_URL inválido — será tratado abaixo
    }
  }

  return out;
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  if (!BACKEND_URL) {
    console.error('[proxy] BACKEND_URL não configurado nas variáveis de ambiente.');
    return NextResponse.json(
      { message: 'Serviço temporariamente indisponível.' },
      { status: 503 },
    );
  }

  const backendPath = '/' + pathSegments.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${backendPath}${search}`;

  const outHeaders = buildForwardHeaders(request);

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: outHeaders,
      body: body ?? null,
      redirect: 'manual',
    });
  } catch (err) {
    console.error('[proxy] Falha ao contactar o backend:', targetUrl, err);
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor.' },
      { status: 502 },
    );
  }

  // Copia headers da resposta, exceto hop-by-hop
  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') {
      responseHeaders.set(key, value);
    }
  });

  // Lê o corpo antes de criar a resposta
  const responseBody =
    backendResponse.status === 204 ? null : await backendResponse.arrayBuffer();

  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  // Repassa cada Set-Cookie individualmente para o domínio Vercel
  const setCookies = backendResponse.headers.getSetCookie?.();
  if (setCookies && setCookies.length > 0) {
    setCookies.forEach((value) => {
      response.headers.append('set-cookie', value);
    });
  } else {
    // Fallback para ambientes onde getSetCookie não existe
    const single = backendResponse.headers.get('set-cookie');
    if (single) {
      response.headers.append('set-cookie', single);
    }
  }

  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return proxyRequest(request, (await params).path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return proxyRequest(request, (await params).path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return proxyRequest(request, (await params).path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return proxyRequest(request, (await params).path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  return proxyRequest(request, (await params).path);
}
