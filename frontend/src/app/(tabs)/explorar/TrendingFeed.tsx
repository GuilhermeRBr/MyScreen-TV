'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FeedCard } from '@/components/FeedCard/FeedCard';
import styles from './page.module.css';

interface FeedMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  genres?: Array<{ name: string }>;
  trailerKey: string | null;
}

interface FeedResponse {
  results: FeedMovie[];
  page: number;
  total_pages: number;
}

interface TrendingFeedProps {
  initialMovies: FeedMovie[];
  initialTotalPages: number;
}

export function TrendingFeed({
  initialMovies,
  initialTotalPages,
}: Readonly<TrendingFeedProps>) {
  const [movies, setMovies] = useState<FeedMovie[]>(initialMovies);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = page < totalPages;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`/api/movies/feed?page=${nextPage}`, {
        credentials: 'include',
      });

      if (!res.ok) return;

      const data = (await res.json()) as FeedResponse;
      setMovies((prev) => [...prev, ...data.results]);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch {
      // silencioso — o usuário pode tentar novamente ao rolar
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className={styles.feed} aria-label="Filmes em destaque">
      {movies.map((movie) => (
        <FeedCard
          key={movie.id}
          id={movie.id}
          title={movie.title}
          overview={movie.overview ?? null}
          backdropPath={movie.backdrop_path ?? null}
          posterPath={movie.poster_path ?? null}
          runtime={movie.runtime ?? null}
          genres={movie.genres ?? null}
          trailerKey={movie.trailerKey}
          mediaType="movie"
        />
      ))}

      {/* Sentinel invisível — quando entra na viewport, carrega mais */}
      <div ref={sentinelRef} aria-hidden="true" />

      {loading && (
        <div className={styles.feedLoadingRow} aria-label="Carregando mais filmes">
          <span className={styles.feedLoadingSpinner} aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
