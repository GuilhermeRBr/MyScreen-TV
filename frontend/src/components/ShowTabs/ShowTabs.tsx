'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './ShowTabs.module.css';

interface ShowTabsProps {
  showId: string;
  from: string | null;
}

export function ShowTabs({ showId, from }: ShowTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const sobreHref = from
    ? `/show/${showId}/sobre?from=${from}`
    : `/show/${showId}/sobre`;

  const episodiosHref = from
    ? `/show/${showId}/episodios?from=${from}`
    : `/show/${showId}/episodios`;

  const isSobre = pathname.includes('/sobre');
  const isEpisodios = pathname.includes('/episodios');

  // Usa replace para não criar entrada extra no histórico ao trocar de aba
  function handleTabClick(href: string, isActive: boolean) {
    if (isActive) return;
    router.replace(href);
  }

  return (
    <nav className={styles.tabs} aria-label="Seções da série">
      <button
        className={`${styles.tab} ${isSobre ? styles.tabActive : ''}`}
        aria-current={isSobre ? 'page' : undefined}
        onClick={() => handleTabClick(sobreHref, isSobre)}
      >
        SOBRE
      </button>
      <button
        className={`${styles.tab} ${isEpisodios ? styles.tabActive : ''}`}
        aria-current={isEpisodios ? 'page' : undefined}
        onClick={() => handleTabClick(episodiosHref, isEpisodios)}
      >
        EPISÓDIOS
      </button>
    </nav>
  );
}
