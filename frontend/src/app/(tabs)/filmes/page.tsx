import Link from 'next/link';
import styles from './page.module.css';
import { PosterCard } from '@/components/PosterCard/PosterCard';
import { IconGrid } from '@/components/icons';

async function getPopularMovies() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/popular`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json() as { results: Array<{ id: number; title: string; poster_path: string | null }> };
    return data.results ?? [];
  } catch {
    return [];
  }
}

export default async function FilmesPage() {
  const movies = await getPopularMovies();

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
        <div className={styles.grid}>
          {movies.map((movie) => (
            <PosterCard
              key={movie.id}
              title={movie.title}
              posterPath={movie.poster_path}
              href={`/filme/${movie.id}`}
            />
          ))}
        </div>
      </section>
    </>
  );
}
