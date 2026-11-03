import Link from 'next/link';
import styles from './page.module.css';
import { MySeriesList } from '@/components/MySeriesList/MySeriesList';

export const dynamic = 'force-dynamic';

export default function SeriesPage() {
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

      <section aria-label="Minha lista de séries">
        <MySeriesList />
      </section>
    </>
  );
}
