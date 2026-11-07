'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

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

export function useInfiniteRecommendations({
  endpoint,
  excludedIds,
  ready,
}: UseInfiniteRecommendationsOptions): UseInfiniteRecommendationsResult {
  const [items, setItems] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(MAX_PAGES);
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
          setItems((prev) => [...prev, ...filtered]);
          break;
        }

        if (nextPageRef.current > totalPagesRef.current) break;
      }
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
