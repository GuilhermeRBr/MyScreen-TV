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

function itemKey(mediaType: 'movie' | 'show', id: number): string {
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

async function addToList(tmdbId: number, mediaType: 'movie' | 'show'): Promise<boolean> {
  try {
    const res = await fetch(`/api/watch/by-tmdb/add?type=${mediaType}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function removeFromList(tmdbId: number, mediaType: 'movie' | 'show'): Promise<boolean> {
  try {
    const res = await fetch(`/api/watch/by-tmdb/remove?type=${mediaType}&tmdbId=${tmdbId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
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
  // "movie-123" -> true/false — única fonte de verdade para o estado da lista
  const [statusMap, setStatusMap] = useState<Record<string, boolean>>({});
  // "movie-123" -> true se há request em andamento
  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});

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

  // Busca status em lote e atualiza o mapa
  const loadStatus = useCallback(async (newItems: FeedItem[]) => {
    const batch = newItems.map((item) => ({
      tmdbId: item.id,
      type: item.mediaType,
    }));
    const result = await fetchBatchStatus(batch);
    setStatusMap((prev) => ({ ...prev, ...result }));
  }, []);

  // Carrega o status da primeira página ao montar
  useEffect(() => {
    const initial = interleave(initialMovies, initialShows);
    if (initial.length > 0) void loadStatus(initial);
    // Intencionalmente sem dependências — só roda na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(
    (id: number, mediaType: 'movie' | 'show') => {
      const key = itemKey(mediaType, id);
      const currently = statusMap[key] ?? false;

      // Optimistic update imediato
      setStatusMap((prev) => ({ ...prev, [key]: !currently }));
      setPendingMap((prev) => ({ ...prev, [key]: true }));

      const action = currently ? removeFromList : addToList;

      action(id, mediaType).then((ok) => {
        if (!ok) {
          // Reverte se falhou
          setStatusMap((prev) => ({ ...prev, [key]: currently }));
        }
        setPendingMap((prev) => ({ ...prev, [key]: false }));
      });
    },
    [statusMap],
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const nextMoviePage = filter !== 'show' && moviePage < movieTotalPages ? moviePage + 1 : null;
      const nextShowPage = filter !== 'movie' && showPage < showTotalPages ? showPage + 1 : null;

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
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, filter, moviePage, showPage, movieTotalPages, showTotalPages, loadStatus]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <section className={styles.feed} aria-label="Filmes e séries em destaque">
      {visibleItems.map((item) => {
        const key = itemKey(item.mediaType, item.id);
        const onList = statusMap[key] ?? false;
        const listPending = pendingMap[key] ?? false;

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
              onList={onList}
              listPending={listPending}
              onListToggle={() => handleToggle(item.id, 'movie')}
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
            onList={onList}
            listPending={listPending}
            onListToggle={() => handleToggle(item.id, 'show')}
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
