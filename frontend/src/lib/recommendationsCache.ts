/**
 * Cache em memória para recomendações infinitas.
 *
 * Persiste entre navegações (vive fora do ciclo de montagem/desmontagem dos
 * componentes) enquanto a sessão do browser estiver aberta.
 *
 * Chave = endpoint (ex: '/shows/popular').
 */

import type { RecommendedItem } from './useInfiniteRecommendations';

interface CacheEntry {
  items: RecommendedItem[];
  nextPage: number;
  totalPages: number;
}

const cache = new Map<string, CacheEntry>();

export function getCacheEntry(endpoint: string): CacheEntry | undefined {
  return cache.get(endpoint);
}

export function setCacheEntry(endpoint: string, entry: CacheEntry): void {
  cache.set(endpoint, entry);
}

export function updateCacheEntry(
  endpoint: string,
  patch: Partial<CacheEntry>,
): void {
  const existing = cache.get(endpoint);
  if (existing) {
    cache.set(endpoint, { ...existing, ...patch });
  }
}
