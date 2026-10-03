import styles from './page.module.css';
import { SeriesInfiniteGrid } from '@/components/SeriesInfiniteGrid/SeriesInfiniteGrid';
import { IconEye, IconFilter } from '@/components/icons';

interface PopularShowsResponse {
  results: Array<{ id: number; name: string; poster_path: string | null }>;
  page: number;
  total_pages: number;
}

async function fetchPopularShows(page = 1): Promise<PopularShowsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/popular?page=${page}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return { results: [], page: 1, total_pages: 1 };

    return res.json() as Promise<PopularShowsResponse>;
  } catch {
    return { results: [], page: 1, total_pages: 1 };
  }
}

export default async function SeriesPage() {
  const data = await fetchPopularShows(1);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Series</h1>
        <div className={styles.controls}>
          <button className={styles.iconButton} aria-label="Ver modo de lista">
            <IconEye />
          </button>
        </div>
      </header>

      <SeriesInfiniteGrid
        initialItems={data.results}
        initialPage={data.page}
        totalPages={data.total_pages}
        gridClassName={styles.grid}
      />

      <button className={styles.filterBar} type="button">
        <IconFilter />
        FILTROS
      </button>
    </>
  );
}
