'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import { useInfiniteRecommendations } from '@/lib/useInfiniteRecommendations';
import { useScrollRestoration, saveScrollPosition } from '@/lib/useScrollRestoration';
import { getCacheEntry } from '@/lib/recommendationsCache';
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
  const [subscriptionsLoaded, setSubscriptionsLoaded] = useState(false);

  // Se já há cache de recomendações, renderiza o conteúdo imediatamente
  // sem bloquear no skeleton enquanto a API de subscriptions responde.
  const hasRecsCache = useRef(!!getCacheEntry('/shows/popular')?.items.length).current;
  const contentReady = subscriptionsLoaded || hasRecsCache;

  useScrollRestoration('scroll:series', contentReady);

  const excludedIds = useMemo(
    () => new Set(items.map((s) => s.show.tmdbId)),
    [items],
  );

  const { items: recommendations, isLoading: recLoading, sentinelRef } =
    useInfiniteRecommendations({ endpoint: '/shows/popular', excludedIds, ready: subscriptionsLoaded });

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<ShowSubscriptionWithProgress[]>('/watch/subscriptions/with-progress')
        .then((data) => {
          if (!cancelled) {
            setItems(data);
            setSubscriptionsLoaded(true);
          }
        })
        .catch((err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return;
          if (!cancelled) {
            setItems([]);
            setSubscriptionsLoaded(true);
          }
        });
    }

    load();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        setSubscriptionsLoaded(false);
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
        <div className={styles.grid} aria-label="Carregando séries...">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      </div>
    );
  }

  const isComplete = (item: ShowSubscriptionWithProgress) =>
    item.progress.totalEpisodes > 0 &&
    item.progress.totalWatched >= item.progress.totalEpisodes;

  const watching = items.filter(
    (item) =>
      (item.status === 'WATCHING' || item.status === 'REWATCHING') &&
      !isComplete(item),
  );
  const notStarted = items.filter((item) => item.progress.totalWatched === 0);

  return (
    <div className={styles.container}>
      {subscriptionsLoaded && items.length === 0 && (
        <p className={styles.empty}>
          Nenhuma série adicionada ainda.{' '}
          <Link href="/explorar" className={styles.emptyLink}>
            Explorar séries
          </Link>
        </p>
      )}

      {/* Séries em andamento */}
      {watching.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Assistindo</p>
          <div className={styles.grid}>
            {watching.map(({ show, progress }) => {
              const progressPercent =
                progress.totalEpisodes > 0
                  ? (progress.totalWatched / progress.totalEpisodes) * 100
                  : 0;

              return (
                <PosterCard
                  key={show.id}
                  title={show.name}
                  posterPath={show.posterPath}
                  href={`/show/${show.tmdbId}/episodios`}
                  progressPercent={progressPercent}
                  onClick={() => saveScrollPosition('scroll:series')}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Divisor */}
      {watching.length > 0 && notStarted.length > 0 && (
        <div className={styles.divider} aria-hidden="true" />
      )}

      {/* Séries não iniciadas */}
      {notStarted.length > 0 && (
        <>
          <p className={styles.sectionTitle}>Assistir a seguir</p>
          <div className={styles.grid}>
            {notStarted.map(({ show }) => (
              <PosterCard
                key={show.id}
                title={show.name}
                posterPath={show.posterPath}
                href={`/show/${show.tmdbId}/episodios`}
                onClick={() => saveScrollPosition('scroll:series')}
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
            {recommendations.map((show) => (
              <PosterCard
                key={show.id}
                title={show.name ?? show.title ?? ''}
                posterPath={show.poster_path}
                href={`/show/${show.id}/sobre`}
                onClick={() => saveScrollPosition('scroll:series')}
              />
            ))}
          </div>
        </>
      )}

      {/* Sentinel sempre montado — o observer dispara o load ao entrar na viewport */}
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
