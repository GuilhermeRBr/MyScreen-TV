import Link from 'next/link';
import styles from './page.module.css';
import { MoviesInfiniteGrid } from '@/components/MoviesInfiniteGrid/MoviesInfiniteGrid';
import { IconGrid } from '@/components/icons';

interface PopularMoviesResponse {
  results: Array<{ id: number; title: string; poster_path: string | null }>;
  page: number;
  total_pages: number;
}

async function fetchPopularMovies(page = 1): Promise<PopularMoviesResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/popular?page=${page}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return { results: [], page: 1, total_pages: 1 };

    return res.json() as Promise<PopularMoviesResponse>;
  } catch {
    return { results: [], page: 1, total_pages: 1 };
  }
}

export default async function FilmesPage() {
  const data = await fetchPopularMovies(1);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Filmes</h1>
      </header>

      <nav className={styles.tabs} aria-label="Secoes de filmes">
        <Link href="/filmes" className={`${styles.tab} ${styles.tabActive}`}>
          MINHA LISTA
        </Link>
        <Link href="/filmes/em-breve" className={styles.tab}>
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
          aria-label="Alternar visualizacao em grade"
        >
          <IconGrid width={18} height={18} />
        </button>
      </div>

      <section aria-label="Minha lista de filmes">
        <MoviesInfiniteGrid
          initialItems={data.results}
          initialPage={data.page}
          totalPages={data.total_pages}
          gridClassName={styles.grid}
        />
      </section>
    </>
  );
}
