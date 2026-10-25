'use client';

import { useEffect, useState } from 'react';
import { IconClock, IconTv, IconClapperboard } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileStats.module.css';

interface UserStats {
  totalEpisodesWatched: number;
  totalMinutesWatched: number;
  totalMoviesWatched: number;
}

export function ProfileStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UserStats>('/watch/stats')
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) return;
        // Silencioso: stats ficam zeradas se houver erro
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hours = stats ? Math.floor(stats.totalMinutesWatched / 60) : 0;
  const episodes = stats?.totalEpisodesWatched ?? 0;
  const movies = stats?.totalMoviesWatched ?? 0;

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconClock width={14} height={14} />
          Tempo vendo TV
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.bigNumber}>{hours}</span>
              <span className={styles.unit}>HORAS</span>
            </>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconTv width={14} height={14} />
          Episódios assistidos
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <span className={styles.bigNumber}>{episodes}</span>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconClapperboard width={14} height={14} />
          Filmes assistidos
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <span className={styles.bigNumber}>{movies}</span>
          )}
        </div>
      </div>
    </div>
  );
}
