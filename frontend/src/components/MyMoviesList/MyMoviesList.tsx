'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import { useInfiniteRecommendations } from '@/lib/useInfiniteRecommendations';
import { useScrollRestoration, saveScrollPosition } from '@/lib/useScrollRestoration';
import { getCacheEntry } from '@/lib/recommendationsCache';
import styles from './MyMoviesList.module.css';

interface MovieWatch {
  status: 'WATCHED' | 'WATCHLIST';
  watchedAt: string | null;
  movie: {
    id: string;
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseDate: string | null;
  };
}

export function MyMoviesList() {
  const [items, setItems] = useState<MovieWatch[]>([]);
  const [moviesLoaded, setMoviesLoaded] = useState(false);

  // Se já há cache de recomendações, renderiza o conteúdo imediatamente
  // sem bloquear no skeleton enquanto a API de filmes responde.
  const hasRecsCache = useRef(!!getCacheEntry('/movies/popular')?.items.length).current;
  const contentReady = moviesLoaded || hasRecsCache;

  useScrollRestoration('scroll:filmes', contentReady);

  const excludedIds = useMemo(
    () => new Set(items.map((w) => w.movie.tmdbId)),
    [items],
  );

  const { items: recommendations, isLoading: recLoading, sentinelRef } =
    useInfiniteRecommendations({
      endpoint: '/movies/popular',
      excludedIds,
      ready: moviesLoaded,
    });

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<MovieWatch[]>('/watch/movies')
        .then((data) => {
          if (!cancelled) {
            setItems(data);
            setMoviesLoaded(true);
          }
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return;
          if (!cancelled) {
            setItems([]);
            setMoviesLoaded(true);
          }
        });
    }

    load();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setMoviesLoaded(false);
        load();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!contentReady) {
    return (
      <div className={styles.container}>
        <div className={styles.grid} aria-label="Carregando filmes...">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  }

  const watchlist = items.filter((w) => w.status === 'WATCHLIST');

  return (
    <div className={styles.container}>
      {moviesLoaded && items.length === 0 && (
        <p className={styles.empty}>
          Nenhum filme adicionado ainda.{' '}
          <Link href="/explorar" className={styles.emptyLink}>
            Explorar filmes
          </Link>
        </p>
      )}

      {/* Filmes da watchlist */}
      {watchlist.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Assistir a seguir</p>
          <div className={styles.grid}>
            {watchlist.map(({ movie }) => (
              <PosterCard
                key={movie.id}
                title={movie.title}
                posterPath={movie.posterPath}
                href={`/filme/${movie.tmdbId}`}
                onClick={() => saveScrollPosition('scroll:filmes')}
              />
            ))}
          </div>
        </>
      )}

      {/* Recomendações com rolagem infinita */}
      {recommendations.length > 0 && (
        <>
          <div className={styles.divider} aria-hidden="true" />
          <p className={styles.sectionTitle}>Recomendações</p>
          <div className={styles.grid}>
            {recommendations.map((movie) => (
              <PosterCard
                key={movie.id}
                title={movie.title ?? movie.name ?? ''}
                posterPath={movie.poster_path}
                href={`/filme/${movie.id}`}
                onClick={() => saveScrollPosition('scroll:filmes')}
              />
            ))}
          </div>
        </>
      )}

      {/* Sentinel sempre montado — dispara load ao entrar na viewport */}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true">
        {recLoading && (
          <div className={styles.loadingRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
