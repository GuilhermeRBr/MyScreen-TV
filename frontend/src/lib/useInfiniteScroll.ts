'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions<T> {
  initialItems: T[];
  initialPage: number;
  totalPages: number;
  fetchPage: (page: number) => Promise<T[]>;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  sentinelRef: React.MutableRefObject<HTMLDivElement | null>;
}

export function useInfiniteScroll<T>({
  initialItems,
  initialPage,
  totalPages,
  fetchPage,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Refs para evitar stale closures no callback do IntersectionObserver
  const currentPageRef = useRef(currentPage);
  const totalPagesRef = useRef(totalPages);
  const isLoadingRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);

  // Mantém os refs atualizados a cada render
  currentPageRef.current = currentPage;
  totalPagesRef.current = totalPages;
  fetchPageRef.current = fetchPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (isLoadingRef.current) return;
        if (currentPageRef.current >= totalPagesRef.current) return;

        const nextPage = currentPageRef.current + 1;

        isLoadingRef.current = true;
        setIsLoading(true);

        fetchPageRef
          .current(nextPage)
          .then((newItems) => {
            setItems((prev) => [...prev, ...newItems]);
            setCurrentPage(nextPage);
          })
          .catch(() => {
            // falha silenciosa — o sentinel continua montado, nova tentativa no próximo scroll
          })
          .finally(() => {
            isLoadingRef.current = false;
            setIsLoading(false);
          });
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
    // O effect só monta/desmonta uma vez — tudo acessa os dados via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, isLoading, sentinelRef };
}
