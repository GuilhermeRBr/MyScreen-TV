import Link from 'next/link';
import styles from '../page.module.css';
import { UpcomingMoviesTimeline } from '@/components/UpcomingMoviesTimeline/UpcomingMoviesTimeline';

export const dynamic = 'force-dynamic';

export default function EmBreveFilmesPage() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Filmes</h1>
      </header>

      <nav className={styles.tabs} aria-label="Seções de filmes">
        <Link href="/filmes" className={styles.tab}>
          MINHA LISTA
        </Link>
        <Link href="/filmes/em-breve" className={`${styles.tab} ${styles.tabActive}`}>
          EM BREVE
        </Link>
      </nav>

      <section aria-label="Próximos lançamentos de filmes">
        <UpcomingMoviesTimeline />
      </section>
    </>
  );
}
