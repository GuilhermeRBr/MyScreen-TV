'use client';

import { PosterCard } from '@/components/PosterCard/PosterCard';
import { useInfiniteScroll } from '@/lib/useInfiniteScroll';
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  async function fetchPage(page: number): Promise<Show[]> {
    const res = await fetch(`${apiUrl}/shows/popular?page=${page}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { results: Show[] };
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
