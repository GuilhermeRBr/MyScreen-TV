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

interface FeedShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  trailerKey: string | null;
}

type FeedItem =
  | (FeedMovie & { mediaType: 'movie' })
  | (FeedShow & { mediaType: 'show' });

interface FeedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
}

interface TrendingFeedProps {
  initialMovies: FeedMovie[];
  initialShows: FeedShow[];
  initialMovieTotalPages: number;
  initialShowTotalPages: number;
  filter: 'all' | 'movie' | 'show';
}

function interleave(movies: FeedMovie[], shows: FeedShow[]): FeedItem[] {
  const items: FeedItem[] = [];
  const len = Math.max(movies.length, shows.length);
  for (let i = 0; i < len; i++) {
    if (movies[i]) items.push({ ...movies[i], mediaType: 'movie' });
    if (shows[i]) items.push({ ...shows[i], mediaType: 'show' });
  }
  return items;
}

// Chave usada no mapa de status: "movie-123" ou "show-456"
function statusKey(mediaType: 'movie' | 'show', id: number): string {
  return `${mediaType}-${id}`;
}

async function fetchBatchStatus(
  items: Array<{ tmdbId: number; type: 'movie' | 'show' }>,
): Promise<Record<string, boolean>> {
  if (items.length === 0) return {};
  try {
    const res = await fetch('/api/watch/by-tmdb/status-batch', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function TrendingFeed({
  initialMovies,
  initialShows,
  initialMovieTotalPages,
  initialShowTotalPages,
  filter,
}: Readonly<TrendingFeedProps>) {
  const [items, setItems] = useState<FeedItem[]>(() =>
    interleave(initialMovies, initialShows),
  );
  // mapa "movie-123" -> true/false
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  const [moviePage, setMoviePage] = useState(1);
  const [showPage, setShowPage] = useState(1);
  const [movieTotalPages, setMovieTotalPages] = useState(initialMovieTotalPages);
  const [showTotalPages, setShowTotalPages] = useState(initialShowTotalPages);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = moviePage < movieTotalPages || showPage < showTotalPages;

  const visibleItems = filter === 'all'
    ? items
    : items.filter((item) => item.mediaType === filter);

  // Busca o status em lote para os items recém-adicionados
  const loadStatus = useCallback(async (newItems: FeedItem[]) => {
    const batch = newItems.map((item) => ({
      tmdbId: item.id,
      type: item.mediaType,
    }));
    const result = await fetchBatchStatus(batch);
    setStatusMap((prev) => ({ ...prev, ...result }));
  }, []);

  // Carrega o status inicial da primeira página
  useEffect(() => {
    const initial = interleave(initialMovies, initialShows);
    if (initial.length > 0) void loadStatus(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const nextMoviePage = (filter !== 'show') && moviePage < movieTotalPages ? moviePage + 1 : null;
      const nextShowPage = (filter !== 'movie') && showPage < showTotalPages ? showPage + 1 : null;

      const [moviesRes, showsRes] = await Promise.all([
        nextMoviePage
          ? fetch(`/api/movies/feed?page=${nextMoviePage}`, { credentials: 'include' })
          : Promise.resolve(null),
        nextShowPage
          ? fetch(`/api/shows/feed?page=${nextShowPage}`, { credentials: 'include' })
          : Promise.resolve(null),
      ]);

      const newMovies: FeedMovie[] = [];
      const newShows: FeedShow[] = [];

      if (moviesRes?.ok) {
        const data = (await moviesRes.json()) as FeedResponse<FeedMovie>;
        newMovies.push(...data.results);
        setMoviePage(data.page);
        setMovieTotalPages(data.total_pages);
      }

      if (showsRes?.ok) {
        const data = (await showsRes.json()) as FeedResponse<FeedShow>;
        newShows.push(...data.results);
        setShowPage(data.page);
        setShowTotalPages(data.total_pages);
      }

      if (newMovies.length > 0 || newShows.length > 0) {
        const newItems = interleave(newMovies, newShows);
        setItems((prev) => [...prev, ...newItems]);
        void loadStatus(newItems);
      }
    } catch {
      // silencioso — o usuário pode tentar novamente ao rolar
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, moviePage, showPage, movieTotalPages, showTotalPages, loadStatus]);

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
    <section className={styles.feed} aria-label="Filmes e séries em destaque">
      {visibleItems.map((item) => {
        const key = statusKey(item.mediaType, item.id);
        const onList = statusMap[key] ?? false;

        if (item.mediaType === 'movie') {
          return (
            <FeedCard
              key={`movie-${item.id}`}
              id={item.id}
              title={item.title}
              overview={item.overview ?? null}
              backdropPath={item.backdrop_path ?? null}
              posterPath={item.poster_path ?? null}
              runtime={item.runtime ?? null}
              genres={item.genres ?? null}
              trailerKey={item.trailerKey}
              mediaType="movie"
              initialOnList={onList}
            />
          );
        }

        return (
          <FeedCard
            key={`show-${item.id}`}
            id={item.id}
            title={item.name}
            overview={item.overview ?? null}
            backdropPath={item.backdrop_path ?? null}
            posterPath={item.poster_path ?? null}
            runtime={null}
            genres={null}
            trailerKey={item.trailerKey}
            mediaType="show"
            initialOnList={onList}
          />
        );
      })}

      <div ref={sentinelRef} aria-hidden="true" />

      {loading && (
        <div className={styles.feedLoadingRow} aria-label="Carregando mais conteúdo">
          <span className={styles.feedLoadingSpinner} aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
