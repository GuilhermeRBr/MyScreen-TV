'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconChevronLeft } from '@/components/icons';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

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

type FilterTab = 'ALL' | 'WATCHED' | 'WATCHLIST';

const FILTER_LABELS: Record<FilterTab, string> = {
  ALL: 'Todos',
  WATCHED: 'Assistidos',
  WATCHLIST: 'Quero assistir',
};

export default function PerfilFilmesPage() {
  const [items, setItems] = useState<MovieWatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  useEffect(() => {
    let cancelled = false;

    api
      .get<MovieWatch[]>('/watch/movies')
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

  const filtered =
    activeFilter === 'ALL'
      ? items
      : items.filter((w) => w.status === activeFilter);

  return (
    <div className={styles.container}>
      <header className={styles.topBar}>
        <Link href="/perfil" className={styles.backButton} aria-label="Voltar para o perfil">
          <IconChevronLeft width={20} height={20} />
        </Link>
        <h1 className={styles.pageTitle}>Filmes</h1>
        <div className={styles.topBarSpacer} aria-hidden="true" />
      </header>

      {/* Filtros */}
      {!loading && !error && items.length > 0 && (
        <div className={styles.filterBar} role="tablist" aria-label="Filtrar filmes">
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeFilter === tab}
              className={`${styles.filterTab} ${activeFilter === tab ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(tab)}
            >
              {FILTER_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      <main className={styles.content}>
        {loading && (
          <div className={styles.grid} aria-label="Carregando filmes...">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={styles.skeleton} aria-hidden="true" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className={styles.emptyMessage}>
            Nao foi possivel carregar seus filmes. Tente novamente.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>Voce ainda nao adicionou nenhum filme.</p>
            <Link href="/filmes" className={styles.emptyAction}>
              Explorar filmes
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <p className={styles.count}>
              {filtered.length} {filtered.length === 1 ? 'filme' : 'filmes'}
            </p>
            {filtered.length === 0 ? (
              <p className={styles.emptyMessage}>Nenhum filme nesta categoria.</p>
            ) : (
              <div className={styles.grid}>
                {filtered.map(({ movie, status }) => (
                  <div key={movie.id} className={styles.item}>
                    <PosterCard
                      title={movie.title}
                      posterPath={movie.posterPath}
                      href={`/filme/${movie.tmdbId}`}
                    />
                    {status === 'WATCHLIST' && (
                      <span className={styles.watchlistBadge}>Quero assistir</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
