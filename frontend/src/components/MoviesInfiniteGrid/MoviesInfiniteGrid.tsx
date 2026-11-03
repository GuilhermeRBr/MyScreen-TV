'use client';

import { PosterCard } from '@/components/PosterCard/PosterCard';
import { useInfiniteScroll } from '@/lib/useInfiniteScroll';
import { api } from '@/lib/api';
import styles from './MoviesInfiniteGrid.module.css';

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
}

interface MoviesInfiniteGridProps {
  initialItems: Movie[];
  initialPage: number;
  totalPages: number;
  gridClassName: string;
}

export function MoviesInfiniteGrid({
  initialItems,
  initialPage,
  totalPages,
  gridClassName,
}: MoviesInfiniteGridProps) {
  async function fetchPage(page: number): Promise<Movie[]> {
    const data = await api.get<{ results: Movie[] }>(`/movies/popular?page=${page}`);
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
        {items.map((movie) => (
          <PosterCard
            key={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            href={`/filme/${movie.id}`}
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
