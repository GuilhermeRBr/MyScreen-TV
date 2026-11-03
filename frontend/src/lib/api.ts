/**
 * Cliente HTTP do frontend.
 *
 * Em produção o browser nunca fala diretamente com o backend externo:
 * todas as requisições passam pelo proxy interno do Next.js (/api/[...path]),
 * que repassa ao backend e cuida de reescrever os cookies no domínio correto.
 *
 * Em desenvolvimento, NEXT_PUBLIC_API_URL aponta para localhost:3001 diretamente
 * para evitar a camada extra de proxy local.
 */

// No browser: '' faz a requisição ir para a própria origem (Vercel), que proxy
// para o backend via app/api/[...path]/route.ts.
// No servidor (SSR/RSC): usa a URL interna do backend diretamente.
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: sempre passa pelo proxy do Next.js
    return '/api';
  }
  // Server-side: chama o backend diretamente (sem hop desnecessário)
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  tags?: string[];
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const contentLength = response.headers.get('content-length');

  if (!contentType.includes('application/json') || contentLength === '0') {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  return JSON.parse(text) as T;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, cache, tags } = options;

  const init: RequestInit = {
    method,
    credentials: 'include', // envia cookies HttpOnly automaticamente
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(cache ? { cache } : {}),
    ...(tags ? { next: { tags } } : {}),
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, init);

  if (response.status === 401) {
    // Tenta refresh automático
    const refreshed = await tryRefresh();

    if (refreshed) {
      // Reexecuta a requisição original após refresh
      const retryResponse = await fetch(`${baseUrl}${path}`, init);

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new ApiError(
          retryResponse.status,
          (errorData as { message?: string }).message ?? 'Erro desconhecido',
          (errorData as { errors?: string[] }).errors,
        );
      }

      return parseResponse<T>(retryResponse);
    }

    // Refresh falhou — redireciona para login (apenas no client)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    throw new ApiError(401, 'Sessão expirada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      (errorData as { message?: string }).message ?? 'Erro na requisição',
      (errorData as { errors?: string[] }).errors,
    );
  }

  return parseResponse<T>(response);
}

async function tryRefresh(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export { ApiError };
