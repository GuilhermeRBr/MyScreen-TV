'use client';

import { useEffect, useState } from 'react';
import { IconClock, IconTv, IconClapperboard } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileStats.module.css';

interface UserStats {
  totalEpisodesWatched: number;
  totalMoviesWatched: number;
  totalMinutesWatched: number;
  seriesMinutesWatched: number;
  moviesMinutesWatched: number;
}

function minutesToHours(minutes: number): number {
  return Math.floor(minutes / 60);
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.grid}>
      {/* Tempo total */}
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardTitle}>
          <IconClock width={14} height={14} />
          Tempo total assistido
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.bigNumber}>
                {minutesToHours(stats?.totalMinutesWatched ?? 0)}
              </span>
              <span className={styles.unit}>HORAS</span>
            </>
          )}
        </div>
      </div>

      {/* Tempo de séries */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconTv width={14} height={14} />
          Tempo em séries
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.bigNumber}>
                {minutesToHours(stats?.seriesMinutesWatched ?? 0)}
              </span>
              <span className={styles.unit}>h</span>
            </>
          )}
        </div>
      </div>

      {/* Tempo de filmes */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconClapperboard width={14} height={14} />
          Tempo em filmes
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <>
              <span className={styles.bigNumber}>
                {minutesToHours(stats?.moviesMinutesWatched ?? 0)}
              </span>
              <span className={styles.unit}>h</span>
            </>
          )}
        </div>
      </div>

      {/* Episódios assistidos */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconTv width={14} height={14} />
          Episódios assistidos
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <span className={styles.bigNumber}>
              {stats?.totalEpisodesWatched ?? 0}
            </span>
          )}
        </div>
      </div>

      {/* Filmes assistidos */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <IconClapperboard width={14} height={14} />
          Filmes assistidos
        </div>
        <div className={styles.cardNumbers}>
          {loading ? (
            <span className={styles.skeletonNumber} aria-hidden="true" />
          ) : (
            <span className={styles.bigNumber}>
              {stats?.totalMoviesWatched ?? 0}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
