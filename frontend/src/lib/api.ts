const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

  const response = await fetch(`${API_URL}${path}`, init);

  if (response.status === 401) {
    // Tenta refresh automático
    const refreshed = await tryRefresh();

    if (refreshed) {
      // Reexecuta a requisição original após refresh
      const retryResponse = await fetch(`${API_URL}${path}`, init);

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}));
        throw new ApiError(
          retryResponse.status,
          (errorData as { message?: string }).message ?? 'Erro desconhecido',
          (errorData as { errors?: string[] }).errors,
        );
      }

      return retryResponse.json() as Promise<T>;
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

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
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
