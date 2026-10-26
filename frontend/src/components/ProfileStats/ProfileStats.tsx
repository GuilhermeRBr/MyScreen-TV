'use client';

import { useEffect, useRef, useState } from 'react';
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
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const cards = [
    {
      key: 'total',
      icon: <IconClock width={14} height={14} />,
      label: 'Tempo total',
      value: loading ? null : minutesToHours(stats?.totalMinutesWatched ?? 0),
      unit: 'HORAS',
    },
    {
      key: 'series-time',
      icon: <IconTv width={14} height={14} />,
      label: 'Tempo em séries',
      value: loading ? null : minutesToHours(stats?.seriesMinutesWatched ?? 0),
      unit: 'h',
    },
    {
      key: 'movies-time',
      icon: <IconClapperboard width={14} height={14} />,
      label: 'Tempo em filmes',
      value: loading ? null : minutesToHours(stats?.moviesMinutesWatched ?? 0),
      unit: 'h',
    },
    {
      key: 'episodes',
      icon: <IconTv width={14} height={14} />,
      label: 'Episódios assistidos',
      value: loading ? null : (stats?.totalEpisodesWatched ?? 0),
      unit: null,
    },
    {
      key: 'movies',
      icon: <IconClapperboard width={14} height={14} />,
      label: 'Filmes assistidos',
      value: loading ? null : (stats?.totalMoviesWatched ?? 0),
      unit: null,
    },
  ];

  return (
    <div
      className={styles.carousel}
      ref={carouselRef}
      role="list"
      aria-label="Estatísticas de tempo assistido"
    >
      {cards.map((card) => (
        <div key={card.key} className={styles.card} role="listitem">
          <div className={styles.cardTitle}>
            {card.icon}
            {card.label}
          </div>
          <div className={styles.cardNumbers}>
            {card.value === null ? (
              <span className={styles.skeletonNumber} aria-hidden="true" />
            ) : (
              <>
                <span className={styles.bigNumber}>{card.value}</span>
                {card.unit && (
                  <span className={styles.unit}>{card.unit}</span>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
