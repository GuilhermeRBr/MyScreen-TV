/**
 * Realiza um fetch autenticado a partir de Server Components do Next.js.
 * Lê o cookie `access_token` do header da requisição atual e o encaminha
 * para o backend, já que `credentials: 'include'` não funciona em server-side.
 */
import { cookies } from 'next/headers';

export async function serverFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers['Cookie'] = `access_token=${accessToken}`;
  }

  return fetch(url, { ...init, headers });
}
