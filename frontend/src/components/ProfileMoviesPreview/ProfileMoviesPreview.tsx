'use client';

import { useEffect, useState } from 'react';
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

const MAX_PREVIEW = 6;

export function ProfileMoviesPreview() {
  const [items, setItems] = useState<MovieWatch[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Recarrega quando o usuário volta para esta aba/página
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

  if (loading) {
    return (
      <div className={styles.grid} aria-label="Carregando filmes...">
        {Array.from({ length: 3 }).map((_, i) => (
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

  const preview = items.slice(0, MAX_PREVIEW);

  return (
    <div className={styles.grid}>
      {preview.map(({ movie }) => (
        <PosterCard
          key={movie.id}
          title={movie.title}
          posterPath={movie.posterPath}
          href={`/filme/${movie.tmdbId}?from=/perfil`}
        />
      ))}
    </div>
  );
}
