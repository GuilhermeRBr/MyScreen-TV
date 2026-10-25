'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './ShowTabs.module.css';

interface ShowTabsProps {
  showId: string;
  from: string | null;
}

export function ShowTabs({ showId, from }: ShowTabsProps) {
  const pathname = usePathname();

  const sobreHref = from
    ? `/show/${showId}/sobre?from=${from}`
    : `/show/${showId}/sobre`;

  const episodiosHref = from
    ? `/show/${showId}/episodios?from=${from}`
    : `/show/${showId}/episodios`;

  const isSobre = pathname.includes('/sobre');
  const isEpisodios = pathname.includes('/episodios');

  return (
    <nav className={styles.tabs} aria-label="Seções da série">
      <Link
        href={sobreHref}
        className={`${styles.tab} ${isSobre ? styles.tabActive : ''}`}
        aria-current={isSobre ? 'page' : undefined}
      >
        SOBRE
      </Link>
      <Link
        href={episodiosHref}
        className={`${styles.tab} ${isEpisodios ? styles.tabActive : ''}`}
        aria-current={isEpisodios ? 'page' : undefined}
      >
        EPISÓDIOS
      </Link>
    </nav>
  );
}
