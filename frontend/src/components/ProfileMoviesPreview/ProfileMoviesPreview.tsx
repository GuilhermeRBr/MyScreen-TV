'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileMoviesPreview.module.css';

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

const SCROLL_AMOUNT = 280;

export function ProfileMoviesPreview() {
  const [items, setItems] = useState<MovieWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  function updateScrollState() {
    const el = gridRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 0);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  function scrollPrev() {
    gridRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  }

  function scrollNext() {
    gridRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  }

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<MovieWatch[]>('/watch/movies')
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return;
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setLoading(true);
        load();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [items]);

  if (loading) {
    return (
      <div className={styles.grid} aria-label="Carregando filmes...">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeleton} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Nenhum filme adicionado ainda.{' '}
        <Link href="/filmes" className={styles.emptyLink}>
          Explorar filmes
        </Link>
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.navBtn} ${styles.navPrev}`}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Rolar para a esquerda"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
          <path d="M13.5 8L10.5 12L13.5 16" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={styles.grid}
        ref={gridRef}
        onScroll={updateScrollState}
      >
        {items.map(({ movie }) => (
          <PosterCard
            key={movie.id}
            title={movie.title}
            posterPath={movie.posterPath}
            href={`/filme/${movie.tmdbId}?from=/perfil`}
          />
        ))}
      </div>

      <button
        className={`${styles.navBtn} ${styles.navNext}`}
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Rolar para a direita"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
          <path d="M10.5 8L13.5 12L10.5 16" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
