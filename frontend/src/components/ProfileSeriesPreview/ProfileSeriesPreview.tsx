'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileSeriesPreview.module.css';

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

const MAX_PREVIEW = 6;

export function ProfileSeriesPreview() {
  const [items, setItems] = useState<ShowSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load() {
      api
        .get<ShowSubscription[]>('/watch/subscriptions')
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
      <div className={styles.grid} aria-label="Carregando séries...">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeleton} aria-hidden="true" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className={styles.empty}>
        Nenhuma série adicionada ainda.{' '}
        <Link href="/series" className={styles.emptyLink}>
          Explorar séries
        </Link>
      </p>
    );
  }

  const preview = items.slice(0, MAX_PREVIEW);

  return (
    <div className={styles.grid}>
      {preview.map(({ show }) => (
        <PosterCard
          key={show.id}
          title={show.name}
          posterPath={show.posterPath}
          href={`/show/${show.tmdbId}/sobre?from=/perfil`}
        />
      ))}
    </div>
  );
}
