'use client';

import { useEffect, useRef, useState } from 'react';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileRecentlyWatched.module.css';

type RecentItem =
  | {
      type: 'show';
      watchedAt: string;
      show: {
        id: string;
        tmdbId: number;
        name: string;
        posterPath: string | null;
      };
    }
  | {
      type: 'movie';
      watchedAt: string;
      movie: {
        id: string;
        tmdbId: number;
        title: string;
        posterPath: string | null;
      };
    };

const SCROLL_AMOUNT = 280;

export function ProfileRecentlyWatched() {
  const [items, setItems] = useState<RecentItem[]>([]);
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
        .get<RecentItem[]>('/watch/recently-watched')
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return;
          if (!cancelled) setItems([]);
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
      <div className={styles.grid} aria-label="Carregando itens vistos por último...">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeleton} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>Nenhum conteúdo assistido ainda.</p>
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
        {items.map((item) => {
          if (item.type === 'show') {
            return (
              <PosterCard
                key={`show-${item.show.id}`}
                title={item.show.name}
                posterPath={item.show.posterPath}
                href={`/show/${item.show.tmdbId}/episodios?from=/perfil`}
              />
            );
          }

          return (
            <PosterCard
              key={`movie-${item.movie.id}`}
              title={item.movie.title}
              posterPath={item.movie.posterPath}
              href={`/filme/${item.movie.tmdbId}?from=/perfil`}
            />
          );
        })}
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
