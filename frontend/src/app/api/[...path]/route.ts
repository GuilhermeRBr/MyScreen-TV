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

/** Cabeçalhos que não devem ser repassados ao backend. */
const SKIP_REQUEST_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  // Não repassar encoding ao backend — o fetch do Node já lida com descompressão
  'accept-encoding',
]);

/** Cabeçalhos que não devem ser repassados ao browser. */
const SKIP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  // O Node já descomprimiu — não repassar o encoding original
  'content-encoding',
  // Será recalculado pelo Next.js
  'content-length',
  // Tratado separadamente
  'set-cookie',
]);

function buildRequestHeaders(request: NextRequest): Headers {
  const out = new Headers();

  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });

  if (BACKEND_URL) {
    try {
      out.set('host', new URL(BACKEND_URL).host);
    } catch {
      // URL inválida — tratada abaixo
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

  const outHeaders = buildRequestHeaders(request);

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

  // Lê o body descomprimido (o fetch do Node descomprime automaticamente)
  const responseBody =
    backendResponse.status === 204 ? null : await backendResponse.text();

  // Monta headers da resposta sem os que devem ser ignorados
  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  const response = new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });

  // Repassa cada Set-Cookie individualmente para o domínio Vercel
  const setCookies = backendResponse.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    setCookies.forEach((value) => {
      response.headers.append('set-cookie', value);
    });
  } else {
    // Fallback para runtimes mais antigos onde getSetCookie não existe
    const raw = backendResponse.headers.get('set-cookie');
    if (raw) {
      response.headers.append('set-cookie', raw);
    }
  }

  console.log(
    `[proxy] ${request.method} ${backendPath} → ${backendResponse.status} | cookies: ${setCookies.length}`,
  );

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
