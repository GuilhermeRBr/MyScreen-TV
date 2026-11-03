'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './MySeriesList.module.css';

interface ShowSubscriptionWithProgress {
  status: string;
  show: {
    id: string;
    tmdbId: number;
    name: string;
    posterPath: string | null;
    status: string | null;
  };
  progress: {
    totalWatched: number;
    totalEpisodes: number;
  };
}

export function MySeriesList() {
  const [items, setItems] = useState<ShowSubscriptionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<ShowSubscriptionWithProgress[]>('/watch/subscriptions/with-progress')
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.grid} aria-label="Carregando séries...">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Nenhuma série adicionada ainda.{' '}
        <Link href="/explorar" className={styles.emptyLink}>
          Explorar séries
        </Link>
      </p>
    );
  }

  const started = items.filter((item) => item.progress.totalWatched > 0);
  const notStarted = items.filter((item) => item.progress.totalWatched === 0);

  return (
    <div className={styles.container}>
      {/* Séries iniciadas */}
      {started.length > 0 && (
        <>
          <p className={styles.sectionTitle}>
            Assistir a seguir
          </p>
          <div className={styles.grid}>
            {started.map(({ show, progress }) => {
              const progressPercent =
                progress.totalEpisodes > 0
                  ? (progress.totalWatched / progress.totalEpisodes) * 100
                  : 0;

              return (
                <PosterCard
                  key={show.id}
                  title={show.name}
                  posterPath={show.posterPath}
                  href={`/show/${show.tmdbId}/sobre`}
                  progressPercent={progressPercent}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Divisor entre seções */}
      {started.length > 0 && notStarted.length > 0 && (
        <div className={styles.divider} aria-hidden="true" />
      )}

      {/* Séries não iniciadas */}
      {notStarted.length > 0 && (
        <>
          <p className={styles.sectionTitle}>
            Minhas séries
          </p>
          <div className={styles.grid}>
            {notStarted.map(({ show }) => (
              <PosterCard
                key={show.id}
                title={show.name}
                posterPath={show.posterPath}
                href={`/show/${show.tmdbId}/sobre`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
