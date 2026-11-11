'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import {
  getCacheEntry,
  setCacheEntry,
  updateCacheEntry,
} from './recommendationsCache';

export interface RecommendedItem {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
}

interface UseInfiniteRecommendationsOptions {
  /** Endpoint paginado — deve retornar `{ results, total_pages }`. Ex: `/shows/popular` */
  endpoint: string;
  /** IDs (tmdbId) a excluir do resultado. */
  excludedIds: Set<number>;
  /** Indica se os excludedIds já foram carregados (aguarda antes de iniciar). */
  ready: boolean;
}

interface UseInfiniteRecommendationsResult {
  items: RecommendedItem[];
  isLoading: boolean;
  sentinelRef: React.RefCallback<HTMLDivElement>;
}

const MAX_PAGES = 50;
const RANDOM_START_RANGE = 10;

function randomStartPage(): number {
  return Math.floor(Math.random() * RANDOM_START_RANGE) + 1;
}

export function useInfiniteRecommendations({
  endpoint,
  excludedIds,
  ready,
}: UseInfiniteRecommendationsOptions): UseInfiniteRecommendationsResult {
  // Inicializa com o cache existente para este endpoint (se houver)
  const cached = getCacheEntry(endpoint);

  const [items, setItems] = useState<RecommendedItem[]>(cached?.items ?? []);
  const [isLoading, setIsLoading] = useState(false);

  // Se já há cache, retoma da próxima página; senão começa aleatório
  const startPage = useRef(cached ? cached.nextPage : randomStartPage());
  const nextPageRef = useRef(startPage.current);
  const totalPagesRef = useRef(cached?.totalPages ?? MAX_PAGES);

  const isLoadingRef = useRef(false);
  const excludedIdsRef = useRef(excludedIds);
  const readyRef = useRef(ready);
  const endpointRef = useRef(endpoint);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

  excludedIdsRef.current = excludedIds;
  readyRef.current = ready;
  endpointRef.current = endpoint;

  const loadNextPage = useCallback(async () => {
    if (isLoadingRef.current) return;
    if (!readyRef.current) return;
    if (nextPageRef.current > totalPagesRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      while (nextPageRef.current <= totalPagesRef.current) {
        const page = nextPageRef.current;
        const data = await api.get<{
          results: RecommendedItem[];
          total_pages: number;
        }>(`${endpointRef.current}?page=${page}`);

        totalPagesRef.current = Math.min(data.total_pages, MAX_PAGES);
        nextPageRef.current = page + 1;

        const filtered = data.results.filter(
          (item) => !excludedIdsRef.current.has(item.id),
        );

        if (filtered.length > 0) {
          setItems((prev) => {
            const next = [...prev, ...filtered];
            // Persiste no cache para restaurar na próxima montagem
            setCacheEntry(endpointRef.current, {
              items: next,
              nextPage: nextPageRef.current,
              totalPages: totalPagesRef.current,
            });
            return next;
          });
          break;
        }

        if (nextPageRef.current > totalPagesRef.current) break;
      }

      // Atualiza o ponteiro de página no cache mesmo que não tenha adicionado itens
      updateCacheEntry(endpointRef.current, {
        nextPage: nextPageRef.current,
        totalPages: totalPagesRef.current,
      });
    } catch {
      // Falha silenciosa — nova tentativa no próximo scroll
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  function connectObserver(node: HTMLDivElement) {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: '400px' },
    );

    observerRef.current.observe(node);
  }

  const sentinelRef: React.RefCallback<HTMLDivElement> = useCallback(
    (node) => {
      sentinelNodeRef.current = node;

      if (!node) {
        observerRef.current?.disconnect();
        return;
      }

      connectObserver(node);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!ready) return;

    // Se já há itens em cache não dispara load automático —
    // o sentinel vai carregar mais quando o usuário chegar ao fim
    if (getCacheEntry(endpoint)?.items.length) {
      if (sentinelNodeRef.current) {
        connectObserver(sentinelNodeRef.current);
      }
      return;
    }

    void loadNextPage();

    if (sentinelNodeRef.current) {
      connectObserver(sentinelNodeRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { items, isLoading, sentinelRef };
}
