import Link from 'next/link';
import styles from './page.module.css';
import { SeriesInfiniteGrid } from '@/components/SeriesInfiniteGrid/SeriesInfiniteGrid';
import { IconGrid } from '@/components/icons';

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
        <h1 className={styles.title}>Séries</h1>
      </header>

      <nav className={styles.tabs} aria-label="Seções de séries">
        <Link href="/series" className={`${styles.tab} ${styles.tabActive}`}>
          MINHA LISTA
        </Link>
        <Link href="/series/em-breve" className={styles.tab}>
          EM BREVE
        </Link>
      </nav>

      <div className={styles.controls}>
        <button
          className={styles.filterBadge}
          type="button"
          aria-label="Filtrar por status"
        >
          ASSISTIR A SEGUIR
        </button>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Alternar visualização em grade"
        >
          <IconGrid width={18} height={18} />
        </button>
      </div>

      <section aria-label="Minha lista de séries">
        <SeriesInfiniteGrid
          initialItems={data.results}
          initialPage={data.page}
          totalPages={data.total_pages}
          gridClassName={styles.grid}
        />
      </section>
    </>
  );
}
