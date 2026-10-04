'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft } from '@/components/icons';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

interface ShowSubscription {
  status: string;
  show: {
    id: string;
    tmdbId: number;
    name: string;
    posterPath: string | null;
    status: string | null;
  };
}

const STATUS_LABEL: Record<string, string> = {
  WATCHING: 'Assistindo',
  REWATCHING: 'Revendo',
  PAUSED: 'Pausado',
  STOPPED: 'Parado',
  PLAN_TO_WATCH: 'Quero assistir',
  NOT_WATCHING_FOR_A_WHILE: 'Em pausa longa',
};

export default function PerfilSeriesPage() {
  const [items, setItems] = useState<ShowSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ShowSubscription[]>('/watch/subscriptions')
      .then((data) => {
        if (!cancelled) setItems(data);
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

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link href="/perfil" className={styles.backButton} aria-label="Voltar para o perfil">
          <IconChevronLeft width={20} height={20} />
        </Link>
        <h1 className={styles.pageTitle}>Séries</h1>
        <div className={styles.topBarSpacer} aria-hidden="true" />
      </header>

      <main className={styles.content}>
        {loading && (
          <div className={styles.grid} aria-label="Carregando séries...">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={styles.skeleton} aria-hidden="true" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className={styles.emptyMessage}>
            Não foi possível carregar suas séries. Tente novamente.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Você ainda não segue nenhuma série.</p>
            <Link href="/series" className={styles.emptyAction}>
              Explorar séries
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <p className={styles.count}>{items.length} {items.length === 1 ? 'série' : 'séries'}</p>
            <div className={styles.grid}>
              {items.map(({ show, status }) => (
                <div key={show.id} className={styles.item}>
                  <PosterCard
                    title={show.name}
                    posterPath={show.posterPath}
                    href={`/show/${show.tmdbId}/sobre`}
                  />
                  <span className={styles.statusBadge}>
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
