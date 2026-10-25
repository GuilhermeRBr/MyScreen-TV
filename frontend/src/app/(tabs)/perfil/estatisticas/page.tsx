'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft, IconClock, IconTv, IconClapperboard } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

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

function minutesRemainder(minutes: number): number {
  return minutes % 60;
}

export default function EstatisticasPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UserStats>('/watch/stats')
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 401)) {
          setError(true);
        }
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
      icon: <IconClock width={16} height={16} />,
      label: 'Tempo total assistido',
      primary: loading ? null : minutesToHours(stats?.totalMinutesWatched ?? 0),
      primaryUnit: 'h',
      secondary: loading ? null : minutesRemainder(stats?.totalMinutesWatched ?? 0),
      secondaryUnit: 'min',
    },
    {
      key: 'series-time',
      icon: <IconTv width={16} height={16} />,
      label: 'Tempo em séries',
      primary: loading ? null : minutesToHours(stats?.seriesMinutesWatched ?? 0),
      primaryUnit: 'h',
      secondary: loading ? null : minutesRemainder(stats?.seriesMinutesWatched ?? 0),
      secondaryUnit: 'min',
    },
    {
      key: 'movies-time',
      icon: <IconClapperboard width={16} height={16} />,
      label: 'Tempo em filmes',
      primary: loading ? null : minutesToHours(stats?.moviesMinutesWatched ?? 0),
      primaryUnit: 'h',
      secondary: loading ? null : minutesRemainder(stats?.moviesMinutesWatched ?? 0),
      secondaryUnit: 'min',
    },
    {
      key: 'episodes',
      icon: <IconTv width={16} height={16} />,
      label: 'Episódios assistidos',
      primary: loading ? null : (stats?.totalEpisodesWatched ?? 0),
      primaryUnit: null,
      secondary: null,
      secondaryUnit: null,
    },
    {
      key: 'movies',
      icon: <IconClapperboard width={16} height={16} />,
      label: 'Filmes assistidos',
      primary: loading ? null : (stats?.totalMoviesWatched ?? 0),
      primaryUnit: null,
      secondary: null,
      secondaryUnit: null,
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link href="/perfil" className={styles.backButton} aria-label="Voltar para o perfil">
          <IconChevronLeft width={20} height={20} />
        </Link>
        <h1 className={styles.pageTitle}>Estatísticas</h1>
        <div className={styles.topBarSpacer} aria-hidden="true" />
      </header>

      <main className={styles.content}>
        {error && (
          <p className={styles.errorMessage}>
            Não foi possível carregar as estatísticas. Tente novamente.
          </p>
        )}

        {!error && (
          <div className={styles.grid} role="list" aria-label="Estatísticas detalhadas">
            {cards.map((card) => (
              <div key={card.key} className={styles.card} role="listitem">
                <div className={styles.cardHeader}>
                  {card.icon}
                  <span className={styles.cardLabel}>{card.label}</span>
                </div>
                <div className={styles.cardValue}>
                  {card.primary === null ? (
                    <span className={styles.skeleton} aria-hidden="true" />
                  ) : (
                    <>
                      <span className={styles.bigNumber}>{card.primary}</span>
                      {card.primaryUnit && (
                        <span className={styles.unit}>{card.primaryUnit}</span>
                      )}
                      {card.secondary !== null && card.secondary !== undefined && (
                        <>
                          <span className={styles.bigNumberSecondary}>
                            {card.secondary}
                          </span>
                          <span className={styles.unit}>{card.secondaryUnit}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
