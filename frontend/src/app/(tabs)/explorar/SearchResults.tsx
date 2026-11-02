'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconTv, IconFilm, IconStar } from '@/components/icons';
import styles from './page.module.css';

interface ShowResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
}

interface MovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}

type SearchItem =
  | (ShowResult & { mediaType: 'show' })
  | (MovieResult & { mediaType: 'movie' });

interface SearchResponse<T> {
  results: T[];
  total_results: number;
}

interface SearchResultsProps {
  query: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchResults({ query }: SearchResultsProps) {
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query.trim(), 400);
  const abortRef = useRef<AbortController | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    // Cancela requisição anterior se ainda estiver em andamento
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const [showsRes, moviesRes] = await Promise.all([
        fetch(`/api/shows/search?q=${encodeURIComponent(q)}&page=1`, {
          signal: controller.signal,
          credentials: 'include',
        }),
        fetch(`/api/movies/search?q=${encodeURIComponent(q)}&page=1`, {
          signal: controller.signal,
          credentials: 'include',
        }),
      ]);

      if (!showsRes.ok || !moviesRes.ok) {
        throw new Error('Erro ao buscar resultados');
      }

      const [showsData, moviesData] = await Promise.all([
        showsRes.json() as Promise<SearchResponse<ShowResult>>,
        moviesRes.json() as Promise<SearchResponse<MovieResult>>,
      ]);

      const shows: SearchItem[] = (showsData.results ?? []).map((s) => ({
        ...s,
        mediaType: 'show' as const,
      }));

      const movies: SearchItem[] = (moviesData.results ?? []).map((m) => ({
        ...m,
        mediaType: 'movie' as const,
      }));

      // Intercala séries e filmes para variedade no feed
      const merged: SearchItem[] = [];
      const maxLen = Math.max(shows.length, movies.length);
      for (let i = 0; i < maxLen; i++) {
        if (shows[i]) merged.push(shows[i]);
        if (movies[i]) merged.push(movies[i]);
      }

      setResults(merged);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('Não foi possível carregar os resultados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    void fetchResults(debouncedQuery);

    return () => {
      abortRef.current?.abort();
    };
  }, [debouncedQuery, fetchResults]);

  if (loading) {
    return (
      <div className={styles.searchState} aria-live="polite" aria-busy="true">
        <p className={styles.searchStateText}>Buscando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.searchState} aria-live="polite">
        <p className={styles.searchStateText}>{error}</p>
      </div>
    );
  }

  if (debouncedQuery.length >= 2 && results.length === 0) {
    return (
      <div className={styles.searchState} aria-live="polite">
        <p className={styles.searchStateText}>
          Nenhum resultado encontrado para &ldquo;{debouncedQuery}&rdquo;.
        </p>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <section className={styles.searchResultsGrid} aria-label={`Resultados para "${debouncedQuery}"`}>
      {results.map((item) => {
        const isShow = item.mediaType === 'show';
        const title = isShow ? (item as ShowResult).name : (item as MovieResult).title;
        const year = isShow
          ? (item as ShowResult).first_air_date?.substring(0, 4)
          : (item as MovieResult).release_date?.substring(0, 4);
        const posterUrl = tmdbImage(item.poster_path, 'w342');
        const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

        return (
          <article key={`${item.mediaType}-${item.id}`} className={styles.searchResultCard}>
            <div className={styles.searchResultPoster}>
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={title}
                  fill
                  className={styles.searchResultPosterImage}
                  sizes="(max-width: 480px) 28vw, (max-width: 768px) 20vw, 150px"
                />
              ) : (
                <div className={styles.searchResultPosterPlaceholder} aria-hidden="true">
                  {isShow ? (
                    <IconTv width={32} height={32} />
                  ) : (
                    <IconFilm width={32} height={32} />
                  )}
                </div>
              )}
            </div>

            <div className={styles.searchResultInfo}>
              <div className={styles.searchResultTypeBadge}>
                {isShow ? (
                  <>
                    <IconTv width={12} height={12} aria-hidden="true" />
                    <span>Série</span>
                  </>
                ) : (
                  <>
                    <IconFilm width={12} height={12} aria-hidden="true" />
                    <span>Filme</span>
                  </>
                )}
              </div>

              <h3 className={styles.searchResultTitle}>{title}</h3>

              <div className={styles.searchResultMeta}>
                {year && <span className={styles.searchResultYear}>{year}</span>}
                {rating && parseFloat(rating) > 0 && (
                  <span className={styles.searchResultRating}>
                    <IconStar width={11} height={11} aria-hidden="true" />
                    {rating}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
