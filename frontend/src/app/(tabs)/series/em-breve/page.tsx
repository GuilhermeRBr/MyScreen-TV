import Link from 'next/link';
import styles from '../page.module.css';
import { UpcomingTimeline } from '@/components/UpcomingTimeline/UpcomingTimeline';

export const dynamic = 'force-dynamic';

export default function EmBreveSeriesPage() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Séries</h1>
      </header>

      <nav className={styles.tabs} aria-label="Seções de séries">
        <Link href="/series" className={styles.tab}>
          MINHA LISTA
        </Link>
        <Link href="/series/em-breve" className={`${styles.tab} ${styles.tabActive}`}>
          EM BREVE
        </Link>
      </nav>

      <section aria-label="Próximos episódios">
        <UpcomingTimeline />
      </section>
    </>
  );
}
