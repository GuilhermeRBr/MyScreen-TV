'use client';

import { PosterCard } from '@/components/PosterCard/PosterCard';
import { useInfiniteScroll } from '@/lib/useInfiniteScroll';
import { api } from '@/lib/api';
import styles from './SeriesInfiniteGrid.module.css';

interface Show {
  id: number;
  name: string;
  poster_path: string | null;
}

interface SeriesInfiniteGridProps {
  initialItems: Show[];
  initialPage: number;
  totalPages: number;
  gridClassName: string;
}

export function SeriesInfiniteGrid({
  initialItems,
  initialPage,
  totalPages,
  gridClassName,
}: SeriesInfiniteGridProps) {
  async function fetchPage(page: number): Promise<Show[]> {
    const data = await api.get<{ results: Show[] }>(`/shows/popular?page=${page}`);
    return data.results ?? [];
  }

  const { items, isLoading, sentinelRef } = useInfiniteScroll({
    initialItems,
    initialPage,
    totalPages,
    fetchPage,
  });

  return (
    <>
      <div className={gridClassName}>
        {items.map((show) => (
          <PosterCard
            key={show.id}
            title={show.name}
            posterPath={show.poster_path}
            href={`/show/${show.id}/sobre`}
          />
        ))}
      </div>

      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true">
        {isLoading && (
          <div className={styles.loadingRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
