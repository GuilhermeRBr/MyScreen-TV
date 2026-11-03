'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export interface RecommendedShow {
  id: number;
  name: string;
  poster_path: string | null;
}

interface UseInfiniteRecommendationsOptions {
  /** IDs (tmdbId) das séries que o usuário já tem na lista — serão excluídas. */
  excludedIds: Set<number>;
  /** Indica se os excludedIds já foram carregados (aguarda antes de iniciar). */
  ready: boolean;
}

interface UseInfiniteRecommendationsResult {
  items: RecommendedShow[];
  isLoading: boolean;
  sentinelRef: React.RefCallback<HTMLDivElement>;
}

const MAX_PAGES = 10;

export function useInfiniteRecommendations({
  excludedIds,
  ready,
}: UseInfiniteRecommendationsOptions): UseInfiniteRecommendationsResult {
  const [items, setItems] = useState<RecommendedShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(MAX_PAGES);
  const isLoadingRef = useRef(false);
  const excludedIdsRef = useRef(excludedIds);
  const readyRef = useRef(ready);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);

  excludedIdsRef.current = excludedIds;
  readyRef.current = ready;

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
          results: RecommendedShow[];
          total_pages: number;
        }>(`/shows/popular?page=${page}`);

        totalPagesRef.current = Math.min(data.total_pages, MAX_PAGES);
        nextPageRef.current = page + 1;

        const filtered = data.results.filter(
          (show) => !excludedIdsRef.current.has(show.id),
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

  // Conecta/reconecta o observer sempre que o nó sentinel mudar
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

  // RefCallback: chamado toda vez que o elemento é montado/desmontado
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

  // Quando ready se torna true, carrega a primeira página e reconecta o observer
  useEffect(() => {
    if (!ready) return;

    // Carrega primeira página
    void loadNextPage();

    // Reconecta o observer caso o sentinel já esteja montado
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
