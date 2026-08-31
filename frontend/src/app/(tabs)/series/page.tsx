import { Suspense } from 'react';
import styles from './page.module.css';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { IconEye, IconFilter } from '@/components/icons';

// Server component — busca dados diretamente no servidor
async function getPopularShows() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/popular`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json() as { results: Array<{ id: number; name: string; poster_path: string | null }> };
    return data.results ?? [];
  } catch {
    return [];
  }
}

async function ShowsGrid() {
  const shows = await getPopularShows();

  return (
    <div className={styles.grid}>
      {shows.map((show) => (
        <PosterCard
          key={show.id}
          title={show.name}
          posterPath={show.poster_path}
          href={`/show/${show.id}/sobre`}
        />
      ))}
    </div>
  );
}

export default function SeriesPage() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Séries</h1>
        <div className={styles.controls}>
          <button className={styles.iconButton} aria-label="Ver modo de lista">
            <IconEye />
          </button>
        </div>
      </header>

      <Suspense
        fallback={
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '2/3',
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            ))}
          </div>
        }
      >
        <ShowsGrid />
      </Suspense>

      <button className={styles.filterBar} type="button">
        <IconFilter />
        FILTROS
      </button>
    </>
  );
}
