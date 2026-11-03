import Link from 'next/link';
import styles from './page.module.css';
import { MyMoviesList } from '@/components/MyMoviesList/MyMoviesList';

export const dynamic = 'force-dynamic';

export default function FilmesPage() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Filmes</h1>
      </header>

      <nav className={styles.tabs} aria-label="Seções de filmes">
        <Link href="/filmes" className={`${styles.tab} ${styles.tabActive}`}>
          MINHA LISTA
        </Link>
        <Link href="/filmes/em-breve" className={styles.tab}>
          EM BREVE
        </Link>
      </nav>

      <section aria-label="Minha lista de filmes">
        <MyMoviesList />
      </section>
    </>
  );
}
